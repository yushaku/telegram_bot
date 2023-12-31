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
  [ChainId.MAINNET]: `wss://mainnet.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.GOERLI]: `wss://goerli.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.SEPOLIA]: `wss://sepolia.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.POLYGON]: `wss://polygon-mainnet.infura.io/ws/v3/${INFURA_KEY}`,
  [ChainId.POLYGON_MUMBAI]: `wss://polygon-mumbai.infura.io/ws/v3/${INFURA_KEY}`,
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

export class SingletonProvider {
  private static instance: JsonRpcProvider;
  private constructor() {}
  public static getInstance(): JsonRpcProvider {
    if (!SingletonProvider.instance) {
      SingletonProvider.instance = new JsonRpcProvider(url);
    }
    return SingletonProvider.instance;
  }
}
