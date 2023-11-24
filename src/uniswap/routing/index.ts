import { JsonRpcProvider } from "@ethersproject/providers";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import JSBI from "jsbi";
import { Erc20Token } from "lib/Erc20token";
import { UniPools } from "uniswap/pools";
import { TransactionState } from "uniswap/types";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
} from "utils/constants";
import { Account } from "utils/types";
import { fromReadableAmount } from "utils/utils";

export class UniRoute {
  private provider: JsonRpcProvider;

  constructor(provider: JsonRpcProvider) {
    this.provider = provider;
  }

  async createTrade({
    tokenA,
    tokenB,
    fee,
    amount,
    account,
  }: {
    tokenA: Token;
    tokenB: Token;
    fee: FeeAmount;
    amount: number;
    account: Account;
  }) {
    const contractA = new Erc20Token(
      tokenA.address,
      tokenA.name,
      tokenA.decimals,
      this.provider,
    );

    const res = await contractA.checkTokenApproval({
      amount,
      account,
      spender: SWAP_ROUTER_ADDRESS,
    });
    if (res === TransactionState.Failed) return;

    const uniPools = new UniPools(this.provider);
    const poolInfo = await uniPools.poolV3(tokenA, tokenB);

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

    const uncheckedTrade = Trade.createUncheckedTrade({
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
    // Give approval to the router to spend the token

    const options: SwapOptions = {
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

    console.log(tx);

    // const res = await sendTransaction(tx);
    // return res;
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
