import { WETH9 } from "@uniswap/sdk-core";
import { USDC_GOERLI } from "@uniswap/smart-order-router";
import { FeeAmount } from "@uniswap/v3-sdk";
import { expect, test, describe } from "bun:test";
import { UniPools } from "uniswap/pools";
import { UniRoute } from "uniswap/routing";
import { getProvider } from "utils/networks";
import { chainId } from "utils/token";
import { toReadableAmount } from "utils/utils";

export const config = {
  wallet: {
    address: "0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2",
    privateKey:
      "0x82387ef67b43b3381bcb066c1a810fd2617f8d5498aeeab1ceea08ca6dca1d55",
  },
  tokens: {
    in: WETH9[chainId],
    amountIn: 1,
    out: USDC_GOERLI,
    poolFee: FeeAmount.MEDIUM,
  },
};

const provider = getProvider();
const pool = new UniPools(provider);

describe("Uni swap from token A to B", () => {
  test("Get Pools", async () => {
    const result = await pool.poolV3(config.tokens.in, config.tokens.out);

    expect(result.token0).toBe(config.tokens.out.address);
    expect(result.token1).toBe(config.tokens.in.address);
    expect(result.fee).toBe(config.tokens.poolFee);
    expect(result.tick).toBeNumber();
    expect(result.tickSpacing).toBeNumber();
    expect(toReadableAmount(result.liquidity)).not.toBeNil();
  });

  test("Generate trade", async () => {
    const uniTrade = new UniRoute(provider);
    const uniTradeResult = await uniTrade.createTrade({
      amount: config.tokens.amountIn,
      fee: config.tokens.poolFee,
      tokenB: config.tokens.out,
      tokenA: config.tokens.in,
      account: config.wallet,
    });

    console.log(uniTradeResult);
  });
});
