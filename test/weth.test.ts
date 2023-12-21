import { WETH9 } from "@uniswap/sdk-core";
import { describe, expect, test } from "bun:test";
import { WrapToken } from "lib/WrapToken";
import { chainId } from "utils/token";
import { wallet, wallet2 } from "./erc20.test";

const weth = WETH9[chainId];
const amount = 10;
const eth = new WrapToken(weth.address);

describe("test function of erc20", () => {
  test("get amount", async () => {
    const res = await eth.getInfo(wallet.address);
    expect(res.symbol).toBe(weth.symbol);
    expect(res.balance).not.toBeNil();
  });

  test("deposit", async () => {
    const before = await eth.balanceOf(wallet.address);
    await eth.wrap(amount * 2, wallet.privateKey);
    const after = await eth.balanceOf(wallet.address);

    console.log({ before, after });
    expect(after).toBe(before + amount * 2);
  });

  test("withdraw", async () => {
    const before = await eth.balanceOf(wallet.address);
    await eth.unwrap(amount, wallet.privateKey);
    const after = await eth.balanceOf(wallet.address);

    console.log({ before, after, sub: before - amount });
    expect(after).toBe(before - amount);
  });

  test("Transfer", async () => {
    const sender1 = await eth.balanceOf(wallet.address);
    const reciever1 = await eth.balanceOf(wallet2);

    await eth.transfer({
      to: wallet2,
      amount,
      privateKey: wallet.privateKey,
    });

    const sender2 = await eth.balanceOf(wallet.address);
    const reciever2 = await eth.balanceOf(wallet2);

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
