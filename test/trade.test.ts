import { UniPools, UniRoute } from "@/uniswap";
import { SWAP_ROUTER_ADDRESS } from "@/utils/constants";
import { getProvider } from "@/utils/networks";
import { chainId } from "@/utils/token";
import { isTransactionReceipt } from "@/utils/types";
import { toReadableAmount } from "@/utils/utils";
import { Currency, TradeType, WETH9 } from "@uniswap/sdk-core";
import { USDC_GOERLI } from "@uniswap/smart-order-router";
import { FeeAmount, Trade } from "@uniswap/v3-sdk";
import { describe, expect, test } from "bun:test";
import { writeData } from "./helper";

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

const provider = getProvider();
const pool = new UniPools(provider);
const amount = 10;

describe("Uni swap from token A to B", () => {
  const uniTrade = new UniRoute(provider);
  let trade: Trade<Currency, Currency, TradeType> | undefined;

  test("Get Pools", async () => {
    const result = await pool.poolV3(tokens.in, tokens.out);

    expect(result.token0).toBe(tokens.out.address);
    expect(result.token1).toBe(tokens.in.address);
    expect(result.fee).toBe(tokens.poolFee);
    expect(result.tick).toBeNumber();
    expect(result.tickSpacing).toBeNumber();
    expect(toReadableAmount(result.liquidity)).not.toBeNil();
  });

  test("Generate trade", async () => {
    const result = await uniTrade.createTrade({
      amount,
      fee: tokens.poolFee,
      tokenB: tokens.out,
      tokenA: tokens.in,
      account,
    });

    console.log(result?.swaps);
    expect(result?.tradeType).toBe(TradeType.EXACT_INPUT);
    expect(result?.swaps).toBeArray();
    expect(result?.swaps.at(0)?.inputAmount).not.toBeNil();
    expect(result?.swaps.at(0)?.outputAmount).not.toBeNil();

    trade = result;
  });

  test("Execute trade", async () => {
    if (!trade) return;

    const result = await uniTrade.executeTrade({
      trade,
      account,
    });

    writeData(result);
    expect(typeof result).not.toBe("string");
    if (!isTransactionReceipt(result)) return;

    expect(result.to).toBe(SWAP_ROUTER_ADDRESS);
    expect(result.from).toBe(account.address);
    expect(toReadableAmount(result.gasUsed)).toBeString();
    expect(result.transactionHash).toBeString();
    expect(result.blockHash).toBeString();
    expect(result.confirmations).toBe(1);
    expect(result.status).toBe(1);
  });
});
