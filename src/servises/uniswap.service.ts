import {
  Contract,
  EtherscanProvider,
  InfuraProvider,
  Provider,
  ethers,
  formatEther,
} from "ethers";
import {
  ChainId,
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import erc20ABI from "../abis/erc20.json";
import { fromReadableAmount, toReadableAmount } from "../utils/utils";
import { INFURA_ID } from "../utils/constants";
import {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  USDC,
  V3_SWAP_ROUTER_ADDRESS,
  WETH,
  chainId,
} from "../utils/token";
import { FeeAmount } from "@uniswap/v3-sdk";
import {
  SwapRoute,
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { CurrentConfig } from "../utils/config";
import { BaseProvider } from "@ethersproject/providers";
import {
  TransactionState,
  getWalletAddress,
  sendTransaction,
} from "../utils/provider";
import { getTokenTransferApproval } from "../utils/trading";

export class UniswapService {
  private provider: Provider;

  constructor() {
    this.provider = new InfuraProvider(chainId, INFURA_ID);
    new EtherscanProvider();
  }

  async checkBalance(address: string) {
    const tokens = {
      in: USDC,
      out: WETH,
      amountIn: 1,
      poolFee: FeeAmount.MEDIUM,
    };

    const [tokenA, tokenB] = await Promise.all([
      this.getCurrencyBalance(address, tokens.in),
      this.getCurrencyBalance(address, tokens.out),
    ]);
    console.log({ tokenA, tokenB });
  }

  async getCurrencyBalance(address: string, currency: Currency) {
    if (currency.isNative) {
      return formatEther(await this.provider.getBalance(address));
    }

    // Get currency otherwise
    const contractERC20 = new Contract(
      currency.address,
      erc20ABI,
      this.provider,
    );

    const [balance, decimals] = await Promise.all([
      contractERC20.balanceOf(address),
      contractERC20.decimals(),
    ]);

    return toReadableAmount(balance, decimals);
  }

  async generateRoute(): Promise<SwapRoute | null> {
    const router = new AlphaRouter({
      chainId: ChainId.MAINNET,
      provider: this.provider as unknown as BaseProvider,
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: CurrentConfig.wallet.address,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    const route = await router.route(
      CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.in,
        fromReadableAmount(
          CurrentConfig.tokens.amountIn,
          CurrentConfig.tokens.in.decimals,
        ).toString(),
      ),
      CurrentConfig.tokens.out,
      TradeType.EXACT_INPUT,
      options,
    );

    return route;
  }

  async executeRoute(route: SwapRoute): Promise<TransactionState> {
    const walletAddress = getWalletAddress();

    if (!walletAddress) {
      throw new Error("Cannot execute a trade without a connected wallet");
    }

    const tokenApproval = await getTokenTransferApproval(
      CurrentConfig.tokens.in,
    );

    if (tokenApproval !== TransactionState.Sent) {
      return TransactionState.Failed;
    }

    const res = await sendTransaction({
      data: route.methodParameters?.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: route?.methodParameters?.value,
      from: walletAddress,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    });

    return res;
  }

  async getTokenTransferApproval(token: Token): Promise<TransactionState> {
    const address = getWalletAddress();
    if (!address) {
      console.log("No Provider Found");
      return TransactionState.Failed;
    }

    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        this.provider,
      );

      const transaction = await tokenContract.approve(
        SWAP_ROUTER_ADDRESS,
        fromReadableAmount(
          TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
          token.decimals,
        ).toString(),
      );

      return sendTransaction({
        ...transaction,
        from: address,
      });
    } catch (e) {
      console.error(e);
      return TransactionState.Failed;
    }
  }
}
