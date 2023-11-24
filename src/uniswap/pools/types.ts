import { BigNumber } from "ethers";

export type PoolInfo = {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: BigNumber;
  liquidity: BigNumber;
  tick: number;
};
