import { chainId } from "@/utils/token";
import { ChainId } from "@uniswap/sdk-core";

export const url = () => {
  switch (chainId) {
    case ChainId.MAINNET:
      return "https://api.ethplorer.io/";
    case ChainId.GOERLI:
      return "https://goerli-api.ethplorer.io/";
    case ChainId.SEPOLIA:
      return "https://sepolia-api.ethplorer.io/";
    case ChainId.BNB:
      return "https://api.binplorer.io/";
    default:
      return "https://api.ethplorer.io/";
  }
};

export const moralisChain = {
  1: "eth",
  5: "goerli",
  11155111: "sepolia",
  137: "polygon",
  80001: "mumbai",
  100: "gnosis",
  56: "bsc",
  8453: "base",
  42161: "arbitrum",
};

export type ScanWallet = {
  address: string;
  ETH: Eth;
  contractInfo: ContractInfo;
  tokens: Token[];
};

export type Eth = {
  price: PriceClass;
  balance: number;
  rawBalance: string;
};

export type Currency = "USD";

export type ContractInfo = {
  creatorAddress: null;
  transactionHash: string;
  timestamp: number;
};

export type Token = {
  tokenInfo: TokenInfo;
  balance: number;
  rawBalance: string;
};

export type TokenInfo = {
  address: string;
  name: string;
  decimals: string;
  symbol: string;
  totalSupply: string;
  owner?: string;
  lastUpdated: number;
  issuancesCount: number;
  price: boolean | PriceClass;
  holdersCount: number;
  image?: string;
  website?: string;
  ethTransfersCount: number;
  publicTags?: string[];
  description?: string;
};

export type PriceClass = {
  rate: number;
  diff: number;
  diff7d: number;
  ts: number;
  marketCapUsd: number;
  availableSupply: number;
  volume24h: number;
  volDiff1: number;
  volDiff7: number;
  volDiff30?: number;
  diff30d?: number;
  bid?: number;
  currency?: Currency;
};

export type TopHolder = {
  address: string;
  balance: number;
  share: number;
};

export type MoralistokenPrice = {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  tokenDecimals: string;
  nativePrice: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeName: string;
  exchangeAddress: string;
  tokenAddress: string;
  toBlock: string;
  priceLastChangedAtBlock: string;
};
