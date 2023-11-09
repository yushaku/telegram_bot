import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route as RouteV2 } from "@uniswap/v2-sdk";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import {
  FACTORY_ADDRESS as FACTORY_ADDRESS_V3,
  computePoolAddress,
} from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import uniswapV2poolABI from "../abis/uniV2pool.json";
import { getProvider } from "./provider";

interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: BigInt;
  liquidity: BigInt;
  tick: number;
}

export async function getPoolInfoV3(
  tokenA: Token,
  tokenB: Token,
  poolFee: any,
): Promise<PoolInfo> {
  const provider = getProvider();

  const currentPoolAddress = computePoolAddress({
    factoryAddress: FACTORY_ADDRESS_V3,
    tokenA,
    tokenB,
    fee: poolFee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider,
  );

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

export async function getPoolInfoV2(
  tokenA: Token,
  tokenB: Token,
): Promise<Pair> {
  const pairAddress = Pair.getAddress(tokenA, tokenB);
  const provider = getProvider();

  const pairContract = new ethers.Contract(
    pairAddress,
    uniswapV2poolABI,
    provider,
  );
  const [reserve0, reserve1] = await pairContract["getReserves"]();

  const tokens = [tokenA, tokenB];
  const [token0, token1] = tokens[0].sortsBefore(tokens[1])
    ? tokens
    : [tokens[1], tokens[0]];

  return new Pair(
    CurrencyAmount.fromRawAmount(token0, reserve0),
    CurrencyAmount.fromRawAmount(token1, reserve1),
  );
}

export async function getRouteV2(tokenA: Token, tokenB: Token) {
  const pair = await getPoolInfoV2(tokenA, tokenB);
  const route = new RouteV2([pair], tokenB, tokenA);
  console.log(route.midPrice.toSignificant(6)); // 1901.08
  console.log(route.midPrice.invert().toSignificant(6)); // 0.000526017

  return route;
}
