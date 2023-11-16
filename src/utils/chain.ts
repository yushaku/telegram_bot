import {
  ChainId,
  Currency,
  NativeCurrency,
  SUPPORTED_CHAINS,
  SupportedChainsType,
  Token,
} from "@uniswap/sdk-core";
import {
  ExtendedEther,
  WRAPPED_NATIVE_CURRENCY,
} from "@uniswap/smart-order-router";
import { MATIC_POLYGON, MATIC_MUMBAI } from "./token";

export const CHAIN_IDS_TO_NAMES = {
  [ChainId.MAINNET]: "mainnet",
  [ChainId.GOERLI]: "goerli",
  [ChainId.SEPOLIA]: "sepolia",
  [ChainId.POLYGON]: "polygon",
  [ChainId.POLYGON_MUMBAI]: "polygon_mumbai",
  [ChainId.CELO]: "celo",
  [ChainId.CELO_ALFAJORES]: "celo_alfajores",
  [ChainId.ARBITRUM_ONE]: "arbitrum",
  [ChainId.ARBITRUM_GOERLI]: "arbitrum_goerli",
  [ChainId.OPTIMISM]: "optimism",
  [ChainId.OPTIMISM_GOERLI]: "optimism_goerli",
  [ChainId.BNB]: "bnb",
  [ChainId.AVALANCHE]: "avalanche",
  [ChainId.BASE]: "base",
} as const;

// Include ChainIds in this array if they are not supported by the UX yet, but are already in the SDK.
const NOT_YET_UX_SUPPORTED_CHAIN_IDS: number[] = [ChainId.BASE_GOERLI];

export type SupportedInterfaceChain = Exclude<
  SupportedChainsType,
  ChainId.BASE_GOERLI
>;

export function isSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>,
): chainId is SupportedInterfaceChain {
  if (featureFlags && chainId && chainId in featureFlags) {
    return featureFlags[chainId];
  }
  return (
    !!chainId &&
    SUPPORTED_CHAINS.indexOf(chainId) !== -1 &&
    NOT_YET_UX_SUPPORTED_CHAIN_IDS.indexOf(chainId) === -1
  );
}

export function asSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>,
): SupportedInterfaceChain | undefined {
  if (!chainId) return undefined;
  if (featureFlags && chainId in featureFlags && !featureFlags[chainId]) {
    return undefined;
  }
  return isSupportedChain(chainId) ? chainId : undefined;
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.OPTIMISM,
  ChainId.ARBITRUM_ONE,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
] as const;

/**
 * Supported networks for V2 pool behavior.
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
] as const;

export const TESTNET_CHAIN_IDS = [
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON_MUMBAI,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM_GOERLI,
  ChainId.CELO_ALFAJORES,
] as const;

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.BNB,
  ChainId.AVALANCHE,
] as const;

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number];

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BASE,
] as const;

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number];

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId): number {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.GOERLI:
    case ChainId.SEPOLIA:
      return 0;
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_GOERLI:
      return 1;
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISM_GOERLI:
      return 2;
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return 3;
    case ChainId.BASE:
      return 4;
    case ChainId.BNB:
      return 5;
    case ChainId.AVALANCHE:
      return 6;
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return 7;
    default:
      return 8;
  }
}

export function isUniswapXSupportedChain(chainId: number) {
  return chainId === ChainId.MAINNET;
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {};

export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId];
  let nativeCurrency: NativeCurrency | Token;
  if (isPolygon(chainId)) {
    nativeCurrency = getPolygonNativeCurrency(chainId);
  } else if (isBsc(chainId)) {
    nativeCurrency = new BscNativeCurrency(chainId);
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId);
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency);
}

export function isPolygon(
  chainId: number,
): chainId is ChainId.POLYGON | ChainId.POLYGON_MUMBAI {
  return chainId === ChainId.POLYGON_MUMBAI || chainId === ChainId.POLYGON;
}

function getPolygonNativeCurrency(chainId: number) {
  switch (chainId) {
    case ChainId.POLYGON:
      return MATIC_POLYGON;
    case ChainId.POLYGON_MUMBAI:
      return MATIC_MUMBAI;
    default:
      throw new Error("Not polygon");
  }
}

export function isBsc(chainId: number): chainId is ChainId.BNB {
  return chainId === ChainId.BNB;
}

class BscNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }

  get wrapped(): Token {
    if (!isBsc(this.chainId)) throw new Error("Not bnb");
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId];
    return wrapped;
  }

  public constructor(chainId: number) {
    if (!isBsc(chainId)) throw new Error("Not bnb");
    super(chainId, 18, "BNB", "BNB");
  }
}
