import { UniRoute } from "@/uniswap";
import { SWAP_ROUTER_ADDRESS } from "@/utils/constants";
import { getProvider } from "@/utils/networks";
import { NODE_ENV, chainId } from "@/utils/token";
import { isTransactionReceipt } from "@/utils/types";
import { toReadableAmount } from "@/utils/utils";
import { WETH9 } from "@uniswap/sdk-core";
import { SwapRoute, USDT_MAINNET } from "@uniswap/smart-order-router";
import { FeeAmount } from "@uniswap/v3-sdk";
import { beforeAll, describe, expect, test } from "bun:test";
import { writeData } from "./helper";
import { WrapToken } from "@/lib/WrapToken";

const account = {
  address: "0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2",
  privateKey:
    "0x82387ef67b43b3381bcb066c1a810fd2617f8d5498aeeab1ceea08ca6dca1d55",
};

const tokens = {
  in: WETH9[chainId],
  out: USDT_MAINNET,
  poolFee: FeeAmount.MEDIUM,
};

describe("Uni swap from token A to B", () => {
  console.info(`🚀 Run on Chain: ${NODE_ENV} with chain id: ${chainId}`);

  const provider = getProvider();
  const uniTrade = new UniRoute(provider);
  let route: SwapRoute | null;
  const amount = 10;

  beforeAll(async () => {
    const weth = WETH9[chainId];
    const eth = new WrapToken(weth.address);
    await eth.wrap(amount * 2, account.privateKey);
  });

  test("Generate smart order router for swap", async () => {
    const result = await uniTrade.generateRoute({
      walletAddress: account.address,
      tokenB: tokens.out,
      tokenA: tokens.in,
      account,
      amount,
    });

    writeData(result, "trade.json");
    console.log({ result });
    expect(result).not.toBeNull();
    expect(result?.methodParameters).not.toBeNull();
    expect(result?.methodParameters?.calldata).toBeString();
    expect(result?.methodParameters?.value).toBeString();
    expect(result?.methodParameters?.to).toBeString();

    route = result;
  });

  test("Execute swap", async () => {
    expect(route).not.toBeNil();
    if (!route) return;

    const result = await uniTrade.executeRoute({
      route,
      account,
    });

    writeData(result);
    expect(isTransactionReceipt(result)).toBeTrue();
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
