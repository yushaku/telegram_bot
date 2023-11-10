import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import JSBI from "jsbi";

import { getPoolInfoV3 } from "./pools";
import {
  TransactionState,
  getProvider,
  getWalletAddress,
  sendTransaction,
} from "./provider";
import {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
} from "./token";
import { fromReadableAmount } from "./utils";
import { TokenTrade } from "./types";

export async function createTrade(
  tokenA: Token,
  tokenB: Token,
  fee: number,
  amount: number,
): Promise<TokenTrade> {
  const poolInfo = await getPoolInfoV3(tokenA, tokenB, fee);
  const pool = new Pool(
    tokenA,
    tokenB,
    fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick,
  );

  const swapRoute = new Route([pool], tokenA, tokenB);
  const amountOut = await getOutputQuote(tokenA, amount, swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenA,
      fromReadableAmount(amount, tokenA.decimals).toString(),
    ),
    outputAmount: CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(amountOut)),
    tradeType: TradeType.EXACT_INPUT,
  });

  return uncheckedTrade;
}

export async function executeTrade(
  tokenA: Token,
  trade: TokenTrade,
): Promise<TransactionState> {
  const walletAddress = getWalletAddress();
  const provider = getProvider();

  if (!walletAddress || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }

  const tokenApproval = await getTokenTransferApproval(tokenA);
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  };

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  const res = await sendTransaction(tx);
  return res;
}

async function getOutputQuote(
  tokenA: Token,
  amount: number,
  route: Route<Currency, Currency>,
) {
  const provider = getProvider();

  const { calldata } = SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      tokenA,
      fromReadableAmount(amount, tokenA.decimals).toString(),
    ),
    TradeType.EXACT_INPUT,
    { useQuoterV2: true },
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
}

export async function getTokenTransferApproval(
  token: Token,
): Promise<TransactionState> {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    console.log("No Provider Found");
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider,
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
