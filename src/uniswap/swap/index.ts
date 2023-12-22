import { SingletonProvider, getProvider } from "@/utils/networks";
import { chainId } from "@/utils/token";
import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from "@uniswap/smart-order-router";
import {
  FeeAmount,
  Pool,
  Route,
  SwapQuoter,
  SwapRouter,
  Trade,
} from "@uniswap/v3-sdk";
import { BigNumber, Wallet, ethers } from "ethers";
import JSBI from "jsbi";
import { Erc20Token } from "lib/Erc20token";
import { UniPools } from "uniswap/pools";
import { TransactionState } from "uniswap/types";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  V2_SWAP_ROUTER_ADDRESS,
} from "utils/constants";
import { Account } from "utils/types";
import { fromReadableAmount, fromReadableToAmount } from "utils/utils";

export class UniSwap {
  protected provider = SingletonProvider.getInstance();

  async generateTrade({
    tokenA,
    tokenB,
    amount,
    account,
    fee = FeeAmount.MEDIUM,
  }: {
    tokenA: Token;
    tokenB: Token;
    fee?: FeeAmount;
    amount: number;
    account: Account;
  }) {
    const tokenIn = new Erc20Token(tokenA.address);
    const [currencyAmount, res] = await Promise.all([
      tokenIn.balanceOf(account.address),
      tokenIn.checkTokenApproval({
        amount,
        account,
        spender: SWAP_ROUTER_ADDRESS,
      }),
    ]);

    if (res === TransactionState.Failed || currencyAmount < amount) {
      console.error(`currency amount: ${currencyAmount} less than ${amount}`);
      throw new Error("Insufficient token balance 🆘");
    }

    const uniPools = new UniPools();
    const poolInfo = await uniPools.getPoolV3(tokenA, tokenB);

    const pool = new Pool(
      tokenA,
      tokenB,
      fee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick,
    );

    const swapRoute = new Route([pool], tokenA, tokenB);

    const amountOut = await this.getOutputQuote({
      route: swapRoute,
      tokenA,
      amount,
    });

    const uncheckedTrade: Trade<Currency, Currency, TradeType> =
      Trade.createUncheckedTrade({
        route: swapRoute,
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
    trade: Trade<Currency, Currency, TradeType>;
    account: Account;
  }) {
    const methodParameters = SwapRouter.swapCallParameters([trade], {
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      recipient: account.address,
    });

    const tx = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      from: account.address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    };

    return this.sendTransaction({ tx, account });
  }

  async generateRoute({
    walletAddress,
    tokenA,
    tokenB,
    amount,
    account,
  }: {
    walletAddress: string;
    tokenA: Token;
    tokenB: Token;
    amount: number;
    account: Account;
  }): Promise<SwapRoute | null> {
    const tokenIn = new Erc20Token(tokenA.address);

    const res = await tokenIn.checkTokenApproval({
      amount,
      account,
      spender: SWAP_ROUTER_ADDRESS,
    });
    if (res === TransactionState.Failed) return null;

    const router = new AlphaRouter({
      chainId,
      provider: this.provider,
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: walletAddress,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 30 * 60), // 30 mins deadline
      type: SwapType.SWAP_ROUTER_02,
    };

    const amountIn = CurrencyAmount.fromRawAmount(
      tokenA,
      fromReadableToAmount(amount, tokenA.decimals).toString(),
    );

    console.log({ amountIn });

    const route = await router.route(
      amountIn,
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
      to: V2_SWAP_ROUTER_ADDRESS,
      data: route.methodParameters?.calldata,
      value: BigNumber.from(route?.methodParameters?.value),
    };

    try {
      return this.sendTransaction({ account, tx });
    } catch (error) {
      console.log(error);
      return "Buy token failed";
    }
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

  async sendTransaction({
    account,
    tx,
  }: {
    account: Account;
    tx: TransactionRequest;
  }): Promise<ethers.providers.TransactionReceipt | undefined> {
    try {
      const signer = new Wallet(account.privateKey, this.provider);

      // const transaction: TransactionRequest = { ...tx };
      // const estimate = await signer.estimateGas(transaction);
      // console.log({ estimate: toReadableAmount(estimate) });
      // transaction.gasLimit = estimate.add(estimate.div(10));

      console.log("send transaction");
      const res = await signer.sendTransaction(tx);
      return res.wait();
    } catch (error) {
      throw new Error("Error sending transaction");
    }
  }
}
