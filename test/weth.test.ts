import { WETH9 } from "@uniswap/sdk-core";
import { USDC_GOERLI } from "@uniswap/smart-order-router";
import { FeeAmount } from "@uniswap/v3-sdk";
import { describe, expect, test } from "bun:test";
import { WrapToken } from "lib/WrapToken";
import { SWAP_ROUTER_ADDRESS } from "utils/constants";
import { getProvider } from "utils/networks";
import { chainId } from "utils/token";

export const config = {
  wallet: {
    address: "0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1",
    privateKey:
      "0x13d8c2dc8286cf55199a5ea81371813b1c09ae0426f4fb922611b5ab264d44f2",
  },
  wallet2: "0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2",
  tokens: {
    in: WETH9[chainId],
    amountIn: 1,
    out: USDC_GOERLI,
    poolFee: FeeAmount.MEDIUM,
  },
};

const weth = WETH9[chainId];
const amount = 10;

const provider = getProvider();
const eth = new WrapToken(weth.address, weth.name, weth.decimals, provider);

describe("test function of erc20", () => {
  test("get amount", async () => {
    const res = await eth.getInfo(config.wallet.address);
    expect(res.symbol).toBe(weth.symbol);
    expect(res.balance).not.toBeNil();
  });

  test("deposit", async () => {
    const before = await eth.balanceOf(config.wallet.address);
    await eth.wrap(amount * 2, config.wallet.privateKey);
    const after = await eth.balanceOf(config.wallet.address);

    console.log({ before, after });
    expect(after).toBe(before + amount * 2);
  });

  test("withdraw", async () => {
    const before = await eth.balanceOf(config.wallet.address);
    await eth.unwrap(amount, config.wallet.privateKey);
    const after = await eth.balanceOf(config.wallet.address);

    console.log({ before, after, sub: before - amount });
    expect(after).toBe(before - amount);
  });

  test("Transfer", async () => {
    const sender1 = await eth.balanceOf(config.wallet.address);
    const reciever1 = await eth.balanceOf(config.wallet2);

    await eth.transfer({
      to: config.wallet2,
      amount,
      privateKey: config.wallet.privateKey,
    });

    const sender2 = await eth.balanceOf(config.wallet.address);
    const reciever2 = await eth.balanceOf(config.wallet2);

    console.log({
      sender1,
      reciever1,
      sender2,
      reciever2,
    });

    expect(reciever2).toBe(reciever1 + amount);
    expect(sender2).toBe(Number((sender1 - amount).toFixed(5)));
  });
});
