import {
  BigintIsh,
  ChainId,
  CurrencyAmount,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  AlphaRouter,
  AlphaRouterConfig,
  nativeOnChain,
} from "@uniswap/smart-order-router";
import JSBI from "jsbi";
import { asSupportedChain } from "utils/chain";
import {
  QuoteResult,
  SwapRouterNativeAssets,
  QuoteState,
  GetQuoteArgs,
} from "./routing/types";
import { DEPRECATED_RPC_PROVIDERS } from "./provider";
import { transformSwapRouteToGetQuoteResult } from "utils/transformSwapRouteToGetQuoteResult";

const routers = new Map<ChainId, AlphaRouter>();

export function getRouter(chainId: ChainId): AlphaRouter {
  const router = routers.get(chainId);
  if (router) return router;

  const supportedChainId = asSupportedChain(chainId);
  if (supportedChainId) {
    const provider = DEPRECATED_RPC_PROVIDERS[supportedChainId];
    const router = new AlphaRouter({ chainId, provider });
    routers.set(chainId, router);
    return router;
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`);
}

async function getQuote(
  {
    tradeType,
    tokenIn,
    tokenOut,
    amount: amountRaw,
  }: {
    tradeType: TradeType;
    tokenIn: {
      address: string;
      chainId: number;
      decimals: number;
      symbol?: string;
    };
    tokenOut: {
      address: string;
      chainId: number;
      decimals: number;
      symbol?: string;
    };
    amount: BigintIsh;
  },
  router: AlphaRouter,
  routerConfig: Partial<AlphaRouterConfig>,
): Promise<QuoteResult> {
  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(
    tokenIn.address as SwapRouterNativeAssets,
  );
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(
    tokenOut.address as SwapRouterNativeAssets,
  );

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenIn.chainId)
    : new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals);

  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOut.chainId)
    : new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals);

  const baseCurrency =
    tradeType === TradeType.EXACT_INPUT ? currencyIn : currencyOut;
  const quoteCurrency =
    tradeType === TradeType.EXACT_INPUT ? currencyOut : currencyIn;

  const amount = CurrencyAmount.fromRawAmount(
    baseCurrency,
    JSBI.BigInt(amountRaw),
  );

  const swapRoute = await router.route(
    amount,
    quoteCurrency,
    tradeType,
    /*swapConfig=*/ undefined,
    routerConfig,
  );

  if (!swapRoute) {
    return { state: QuoteState.NOT_FOUND };
  }

  return transformSwapRouteToGetQuoteResult(tradeType, amount, swapRoute);
}

export async function getClientSideQuote(
  {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
    amount,
    tradeType,
  }: GetQuoteArgs,
  router: AlphaRouter,
  config: Partial<AlphaRouterConfig>,
) {
  return getQuote(
    {
      tradeType,
      tokenIn: {
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol,
      },
      tokenOut: {
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      },
      amount,
    },
    router,
    config,
  );
}
