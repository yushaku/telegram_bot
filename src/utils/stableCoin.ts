import { chainId } from "./token";

const eth = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x0000000000085d4780B73119b644AE5ecd22b376": "TUSD",
  "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409": "FDUSD",
};

const bsc = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x0000000000085d4780B73119b644AE5ecd22b376": "TUSD",
  "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409": "FDUSD",
};

const stableCoin = {
  1: eth,
  56: bsc,
};

export const stableCoinList = new Map(
  Object.entries(stableCoin[chainId as keyof typeof stableCoin]),
);
