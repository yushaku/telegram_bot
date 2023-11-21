import { ChainId } from "@uniswap/sdk-core";
import { INFURA_KEY } from "./constants";
import { chainId } from "./token";
import { ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

export const RPC_URLS = {
  [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
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

export function getProvider() {
  return new JsonRpcProvider(RPC_URLS[chainId]);
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
