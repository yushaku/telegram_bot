import { Token } from "@uniswap/sdk-core";
import { WETH, USDC } from "./token";

export type Environment = "TESTNET" | "MAINNET" | "ZKSYNC";

export type UniConfig = {
  env: Environment;
  rpc: {
    testnet: string;
    mainnet: string;
    zksync: string;
  };
  wallet: {
    address: string;
    privateKey: string;
  };
  tokens: {
    in: Token;
    amountIn: number;
    out: Token;
    poolFee: number;
  };
};

export const CurrentConfig: UniConfig = {
  env: "MAINNET",
  rpc: {
    testnet: "https://goerli.infura.io/v3/354872a8849140a48afe69abdea29f00",
    mainnet: "https://mainnet.infura.io/v3/354872a8849140a48afe69abdea29f00",
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
    out: USDC,
    poolFee: 0,
  },
};
