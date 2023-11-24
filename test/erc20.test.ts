import { Token, WETH9 } from "@uniswap/sdk-core";
import { USDC_GOERLI } from "@uniswap/smart-order-router";
import { FeeAmount } from "@uniswap/v3-sdk";
import { describe, expect, test } from "bun:test";
import { Erc20Token } from "lib/Erc20token";
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

const amount = 10;

const ysk = new Token(
  chainId,
  "0x461d35B87F3271c42bE1f553930aeddda6c2F53b",
  18,
  "YSK",
);
const provider = getProvider();
const yushaku = new Erc20Token(ysk.address, ysk.name, ysk.decimals, provider);

describe("test function of erc20", () => {
  test("get amount", async () => {
    const res = await yushaku.getInfo(config.wallet.address);

    expect(res.symbol).toBe(ysk.symbol);
    expect(res.balance).not.toBeNil();
  });

  test("check allownce", async () => {
    const approved1 = await yushaku.allowance(
      config.wallet.address,
      SWAP_ROUTER_ADDRESS,
    );

    const res = await yushaku.checkTokenApproval({
      account: config.wallet,
      amount: amount + approved1,
      spender: SWAP_ROUTER_ADDRESS,
    });

    expect(res.transactionHash).toBeString();
    expect(res.blockHash).toBeString();
    expect(res.to).toBe(ysk.address);
    expect(res.from).toBe(config.wallet.address);
  });

  test("Transfer", async () => {
    const balance1 = await yushaku.balanceOf(config.wallet.address);
    const balance2 = await yushaku.balanceOf(config.wallet2);

    await yushaku.transfer({
      to: config.wallet2,
      amount,
      privateKey: config.wallet.privateKey,
    });

    const balance11 = await yushaku.balanceOf(config.wallet.address);
    const balance22 = await yushaku.balanceOf(config.wallet2);

    expect(balance11).toBe(balance1 - amount);
    expect(balance22).toBe(balance2 + amount);
  });
});
