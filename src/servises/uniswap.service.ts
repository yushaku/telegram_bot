import { BigNumber, Contract, Wallet, ethers } from "ethers";
import JSBI from "jsbi";
import ERC20_ABI from "../abis/erc20.json";
import {
  fromReadableAmount,
  fromReadableToAmount,
  toReadableAmount,
} from "../utils/utils";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS,
  chainId,
} from "../utils/token";
import { TransactionState, getProvider } from "../utils/provider";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  SwapRoute,
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
  SwapOptions,
} from "@uniswap/smart-order-router";
import { Account, TokenTrade } from "../utils/types";
import { Pool, Route, Trade, SwapRouter, SwapQuoter } from "@uniswap/v3-sdk";
import { getPoolInfoV3 } from "../utils/pools";

export class UniswapService {
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = getProvider();
  }

  async checkBalance({
    walletAddress,
    tokens,
  }: {
    walletAddress: string;
    tokens: { tokenA: Token; tokenB: Token };
  }) {
    const [tokenA, tokenB] = await Promise.all([
      this.getTokenInfo({
        walletAddress,
        tokenAddress: tokens.tokenA.address,
      }),
      this.getTokenInfo({
        walletAddress,
        tokenAddress: tokens.tokenB.address,
      }),
    ]);

    return { tokenA, tokenB };
  }

  async getTokenInfo({
    tokenAddress,
    walletAddress,
  }: {
    tokenAddress: string;
    walletAddress?: string;
  }) {
    const contractERC20 = new Contract(tokenAddress, ERC20_ABI, this.provider);

    const [balance, decimals, name, symbol] = await Promise.all([
      walletAddress ? contractERC20.balanceOf(walletAddress) : 0,
      contractERC20.decimals(),
      contractERC20.name(),
      contractERC20.symbol(),
    ]);

    return {
      balance: toReadableAmount(balance, decimals),
      decimals,
      name,
      symbol,
    };
  }

  async generateRoute({
    walletAddress,
    tokenA,
    tokenB,
    amount,
  }: {
    walletAddress: string;
    tokenA: Token;
    tokenB: Token;
    amount: number;
  }): Promise<SwapRoute | null> {
    const router = new AlphaRouter({
      chainId,
      provider: this.provider,
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: walletAddress,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    const route = await router.route(
      CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableToAmount(amount, tokenA.decimals).toString(),
      ),
      tokenB,
      TradeType.EXACT_INPUT,
      options,
    );

    return route;
  }

  async executeRoute({
    route,
    account,
  }: {
    route: SwapRoute;
    account: Account;
  }) {
    const tx = {
      chainId,
      from: account.address,
      to: V3_SWAP_ROUTER_ADDRESS,
      data: route.methodParameters?.calldata,
      value: BigNumber.from(route?.methodParameters?.value),
    };

    const txResponse = await this.sendTransaction({ account, tx });
    return txResponse;
  }

  async sendTransaction({
    account,
    tx,
  }: {
    account: Account;
    tx: Record<string, any>;
  }) {
    try {
      const signer = new Wallet(account.privateKey, this.provider);
      const [nonce, gasLimit] = await Promise.all([
        signer.getTransactionCount(),
        this.provider.getBlock("latest").then((data) => data.gasLimit),
      ]);

      const signedTransaction = await signer.signTransaction({
        ...tx,
        nonce,
        gasLimit,
      });

      console.log("send transaction");

      const txResponse = await this.provider.sendTransaction(signedTransaction);

      return txResponse;
    } catch (error) {
      console.log(error);
      return "Buy token failed";
    }
  }

  async getTokenTransferApproval({
    token,
    account,
    amount,
  }: {
    token: Token;
    amount: number;
    account: Account;
  }) {
    try {
      const signer = new Wallet(account.privateKey, this.provider);
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);

      const allowedAmount = await tokenContract.allowance(
        account.address,
        V3_SWAP_ROUTER_ADDRESS,
      );

      if (allowedAmount >= amount) return "ok";

      const transaction = await tokenContract.approve(
        V3_SWAP_ROUTER_ADDRESS,
        fromReadableAmount(
          TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
          token.decimals,
        ).toString(),
      );

      await transaction.wait();
      return "ok";
    } catch (e) {
      console.error(e);
      return TransactionState.Failed;
    }
  }

  async createTrade({
    tokenA,
    tokenB,
    amount,
    poolFee = 0,
  }: {
    tokenA: Token;
    tokenB: Token;
    amount: number;
    poolFee?: number;
  }): Promise<TokenTrade> {
    console.info("fuck");
    const poolInfo = await getPoolInfoV3(tokenA, tokenB, poolFee);
    console.info("poolInfo", poolInfo);

    const pool = new Pool(
      tokenA,
      tokenB,
      poolFee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick,
    );

    const route = new Route([pool], tokenA, tokenB);
    const amountOut = await this.getOutputQuote({ tokenA, amount, route });

    console.log({ route, amountOut });

    const uncheckedTrade = Trade.createUncheckedTrade({
      route,
      inputAmount: CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableAmount(amount, tokenA.decimals).toString(),
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        tokenB,
        JSBI.BigInt(amountOut),
      ),
      tradeType: TradeType.EXACT_INPUT,
    });

    return uncheckedTrade;
  }

  async executeTrade({
    trade,
    account,
  }: {
    trade: TokenTrade;
    account: Account;
  }) {
    const options: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
      recipient: account.address,
    };

    const methodParameters = SwapRouter.swapCallParameters([trade], options);

    const tx = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      from: account.address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    };

    return this.sendTransaction({ account, tx });
  }

  async getOutputQuote({
    route,
    tokenA,
    amount,
  }: {
    route: Route<Currency, Currency>;
    tokenA: Token;
    amount: number;
  }) {
    const { calldata } = SwapQuoter.quoteCallParameters(
      route,
      CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableAmount(amount, tokenA.decimals).toString(),
      ),
      TradeType.EXACT_INPUT,
      { useQuoterV2: true },
    );

    const quoteCallReturnData = await this.provider.call({
      to: QUOTER_CONTRACT_ADDRESS,
      data: calldata,
    });

    return ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      quoteCallReturnData,
    );
  }
}
