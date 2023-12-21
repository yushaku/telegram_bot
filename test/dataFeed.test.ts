import { describe, expect, test } from "bun:test";
import { DataFeed } from "@/lib/DataFeed";

const btc = new DataFeed("BTC");
describe("Test get price from data feed on ChainLink ", () => {
  test("get lastest price", async () => {
    const price = await btc.getPrice();
    console.log({ price });
    expect(price).not.toBeNil();
    expect(price).toBeNumber();
  });

  test("get lastest price", async () => {
    const roundId = 110680464442257318728n;
    const res = await btc.getAnswer(roundId);
    console.log(res);
  });

  // test("get amount", async () => {
  //   const res = await btc.getRoundData();
  //   expect(res).not.toBeNil();
  // });
});
