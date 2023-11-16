import { ChainId } from "@uniswap/sdk-core";
import { env } from "bun";
import { ethers } from "ethers";
import { SupportedInterfaceChain } from "utils/chain";
import { CurrentConfig } from "utils/config";
import { RPC_URLS } from "utils/networks";
import AppStaticJsonRpcProvider from "./AppStaticJsonRpcProvider";

// const providerFactory = (chainId: SupportedInterfaceChain, i = 0) => new AppStaticJsonRpcProvider(chainId, RPC_URLS[chainId][i] as string);
//
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

const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet,
);

const testnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.testnet,
);

// Provider and Wallet Functions

export function getMainnetProvider() {
  return mainnetProvider;
}

export function getProvider() {
  switch (env.NODE_ENV) {
    case "TESTNET":
      return testnetProvider;

    case "MAINNET":
      return mainnetProvider;

    default:
      return testnetProvider;
  }
}
