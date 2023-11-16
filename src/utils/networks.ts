import { ChainId } from "@uniswap/sdk-core";
import { INFURA_KEY } from "./constants";

export const RPC_URLS = {
  [ChainId.MAINNET]: [`https://mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.GOERLI]: [`https://goerli.infura.io/v3/${INFURA_KEY}`],
  [ChainId.SEPOLIA]: [`https://sepolia.infura.io/v3/${INFURA_KEY}`],
  [ChainId.OPTIMISM]: [`https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.OPTIMISM_GOERLI]: [
    `https://optimism-goerli.infura.io/v3/${INFURA_KEY}`,
  ],
  [ChainId.ARBITRUM_ONE]: [
    `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  ],
  [ChainId.ARBITRUM_GOERLI]: [
    `https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`,
  ],
  [ChainId.POLYGON]: [`https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.POLYGON_MUMBAI]: [
    `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
  ],
  [ChainId.AVALANCHE]: [`https://avalanche-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.BASE]: [`https://base-mainnet.infura.io/v3/${INFURA_KEY}`],
};
