import { SingletonProvider } from "@/utils/networks";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route as RouteV2 } from "@uniswap/v2-sdk";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import {
  FACTORY_ADDRESS as FACTORY_ADDRESS_V3,
  FeeAmount,
  computePoolAddress,
} from "@uniswap/v3-sdk";
import uniswapV2poolABI from "abis/uniV2pool.json";
import { Contract, ethers } from "ethers";
import { PoolInfo } from "../types";

export class UniPools {
  protected provider = SingletonProvider.getInstance();

  async getPoolV3(tokenA: Token, tokenB: Token): Promise<PoolInfo> {
    const poolAddress = computePoolAddress({
      factoryAddress: FACTORY_ADDRESS_V3,
      tokenA,
      tokenB,
      fee: FeeAmount.MEDIUM,
    });

    const poolContract = new Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      this.provider,
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

  async getPoolV2(tokenA: Token, tokenB: Token): Promise<Pair> {
    const pairAddress = Pair.getAddress(tokenA, tokenB);

    const pairContract = new ethers.Contract(
      pairAddress,
      uniswapV2poolABI,
      this.provider,
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

  async getRouteV2(tokenA: Token, tokenB: Token) {
    const pair = await this.getPoolV2(tokenA, tokenB);
    const route = new RouteV2([pair], tokenB, tokenA);
    console.log(route.midPrice.toSignificant(6)); // 1901.08
    console.log(route.midPrice.invert().toSignificant(6)); // 0.000526017
    return route;
  }
}
