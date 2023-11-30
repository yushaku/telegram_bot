import { ChainId } from "@uniswap/sdk-core";
import { INFURA_KEY } from "./constants";
import { NODE_ENV, chainId } from "./token";
import { JsonRpcProvider } from "@ethersproject/providers";
import Web3 from "web3";

export const RPC_URLS = {
  [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.GOERLI]: `https://ethereum-goerli.publicnode.com`,
  [ChainId.SEPOLIA]: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
  [ChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.OPTIMISM_GOERLI]: `https://optimism-goerli.infura.io/v3/${INFURA_KEY}`,
  [ChainId.ARBITRUM_ONE]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.ARBITRUM_GOERLI]: `https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`,
  [ChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.POLYGON_MUMBAI]: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
  [ChainId.AVALANCHE]: `https://avalanche-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.BASE]: `https://base-mainnet.infura.io/v3/${INFURA_KEY}`,
};

export const RPC_WS = {
  [ChainId.MAINNET]: `ws://mainnet.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.GOERLI]: `ws://goerli.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.SEPOLIA]: `ws://sepolia.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.POLYGON]: `ws://polygon-mainnet.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.POLYGON_MUMBAI]: `ws://polygon-mumbai.infura.io/ws/v3/${INFURA_KEY}`,
};

export const getUrlScan = () => {
  switch (chainId) {
    case ChainId.GOERLI:
      return `https://goerli.etherscan.io`;

    case ChainId.MAINNET:
      return `https://etherscan.io`;

    case ChainId.SEPOLIA:
      return `https://sepolia.etherscan.io`;
  }
};
export const urlScan = getUrlScan();

export const ws =
  NODE_ENV === "LOCAL"
    ? "ws://localhost:8545"
    : RPC_WS[chainId as keyof typeof RPC_WS];

export const url =
  NODE_ENV === "LOCAL"
    ? "http://127.0.0.1:8545"
    : RPC_URLS[chainId as keyof typeof RPC_URLS];

export function getProvider() {
  return new JsonRpcProvider(url);
}

export function getWeb3Provider() {
  return new Web3(url);
}

export class Provider {
  private static instance: JsonRpcProvider;
  private constructor() {}
  public static getInstance(): JsonRpcProvider {
    if (!Provider.instance) {
      Provider.instance = new JsonRpcProvider(url);
    }
    return Provider.instance;
  }
}

// const providerFactory = (chainId: SupportedInterfaceChain, i = 0) => new AppStaticJsonRpcProvider(chainId, RPC_URLS[chainId][i] as string);
// export const DEPRECATED_RPC_PROVIDERS = {
//   [ChainId.MAINNET]: providerFactory(ChainId.MAINNET),
//   [ChainId.GOERLI]: providerFactory(ChainId.GOERLI),
//   [ChainId.SEPOLIA]: providerFactory(ChainId.SEPOLIA),
//   [ChainId.OPTIMISM]: providerFactory(ChainId.OPTIMISM),
//   [ChainId.OPTIMISM_GOERLI]: providerFactory(ChainId.OPTIMISM_GOERLI),
//   [ChainId.ARBITRUM_ONE]: providerFactory(ChainId.ARBITRUM_ONE),
//   [ChainId.ARBITRUM_GOERLI]: providerFactory(ChainId.ARBITRUM_GOERLI),
//   [ChainId.POLYGON]: providerFactory(ChainId.POLYGON),
//   [ChainId.POLYGON_MUMBAI]: providerFactory(ChainId.POLYGON_MUMBAI),
//   [ChainId.CELO_ALFAJORES]: providerFactory(ChainId.CELO_ALFAJORES),
//   [ChainId.BNB]: providerFactory(ChainId.BNB),
//   [ChainId.AVALANCHE]: providerFactory(ChainId.AVALANCHE),
//   [ChainId.BASE]: providerFactory(ChainId.BASE),
// };
