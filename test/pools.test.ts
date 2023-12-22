import { UniPools, UniSwap } from "@/uniswap";
import { chainId } from "@/utils/token";
import { toReadableAmount } from "@/utils/utils";
import { Currency, TradeType, WETH9 } from "@uniswap/sdk-core";
import { USDC_GOERLI } from "@uniswap/smart-order-router";
import { FeeAmount, Trade } from "@uniswap/v3-sdk";
import { describe, expect, test } from "bun:test";

const account = {
  address: "0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2",
  privateKey:
    "0x82387ef67b43b3381bcb066c1a810fd2617f8d5498aeeab1ceea08ca6dca1d55",
};

const tokens = {
  in: WETH9[chainId],
  out: USDC_GOERLI,
  poolFee: FeeAmount.MEDIUM,
};

describe("Uni swap from token A to B", () => {
  let trade: Trade<Currency, Currency, TradeType> | undefined;
  const uniTrade = new UniSwap();
  const pool = new UniPools();
  const amount = 10;

  test("Get Pools", async () => {
    const result = await pool.getPoolV3(tokens.in, tokens.out);

    expect(result.token0).toBe(tokens.out.address);
    expect(result.token1).toBe(tokens.in.address);
    expect(result.fee).toBe(tokens.poolFee);
    expect(result.tick).toBeNumber();
    expect(result.tickSpacing).toBeNumber();
    expect(toReadableAmount(result.liquidity)).not.toBeNil();
  });
});
