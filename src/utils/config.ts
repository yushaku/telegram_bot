import { Token } from "@uniswap/sdk-core";
import { UNI, WETH } from "./token";

export type Environment = "TESTNET" | "MAINNET" | "ZKSYNC";

export const CurrentConfig = {
  rpc: {
    testnet:
      "https://eth-goerli.g.alchemy.com/v2/e7ZIQdFSq8BUrGsFCV41sqBcf1t8ZzZy",
    mainnet:
      "https://eth-mainnet.g.alchemy.com/v2/G52kJXx2IBe-2K5aTk-pI29YQadXz-ZD",
    zksync: "https://testnet.era.zksync.dev",
  },
  wallet: {
    address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  tokens: {
    in: WETH,
    amountIn: 1,
    out: UNI,
    poolFee: 0,
  },
};
