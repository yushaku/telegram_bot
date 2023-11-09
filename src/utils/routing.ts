import { TradeType, CurrencyAmount, Percent, Token } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import {
  SwapRoute,
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import {
  TransactionState,
  getProvider,
  getWalletAddress,
  sendTransaction,
} from "./provider";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  ERC20_ABI,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS,
  chainId,
} from "./token";
import { fromReadableAmount } from "./utils";

export async function generateRoute(
  walletAddress: string,
  tokenA: Token,
  tokenB: Token,
  amount: number,
): Promise<SwapRoute | null> {
  const router = new AlphaRouter({
    chainId,
    provider: getProvider(),
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
      fromReadableAmount(amount, tokenA.decimals).toString(),
    ),
    tokenB,
    TradeType.EXACT_INPUT,
    options,
  );

  return route;
}

export async function executeRoute(
  route: SwapRoute,
  tokenA: Token,
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
      V3_SWAP_ROUTER_ADDRESS,
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
