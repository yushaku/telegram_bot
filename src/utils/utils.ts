import { Token, TradeType } from "@uniswap/sdk-core";
import JSBI from "jsbi";
import { Trade } from "@uniswap/v3-sdk";
import { BigNumber, Wallet, ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";

export function fromReadableAmount(
  amount: number,
  decimals: number,
): BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

export function fromReadableToAmount(amount: number, decimals: number): JSBI {
  const extraDigits = Math.pow(10, countDecimals(amount));
  const adjustedAmount = amount * extraDigits;
  return JSBI.divide(
    JSBI.multiply(
      JSBI.BigInt(adjustedAmount),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)),
    ),
    JSBI.BigInt(extraDigits),
  );
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0;
  }
  return x.toString().split(".")[1].length || 0;
}

export function toReadableAmount(
  rawAmount: number | BigNumber,
  decimals = 18,
): string {
  return formatUnits(rawAmount, decimals);
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

export function parseKey(seedPhrase: string = "", index: number = 0) {
  return seedPhrase.includes(" ")
    ? Wallet.fromMnemonic(seedPhrase, `m/44'/60'/0'/0/${index}`)
    : new Wallet(seedPhrase);
}

export function createAccount() {
  return Wallet.createRandom();
}

export function shortenAddress(str: string, numChars: number = 4) {
  return `${str.substring(0, numChars)}...${str.substring(
    str.length - numChars,
  )}`;
}

export function toFixedIfNecessary(value: string, decimalPlaces: number = 2) {
  return +parseFloat(value).toFixed(decimalPlaces);
}

export function bigintToNumber(num: number | BigNumber, decimal = 18) {
  return Number(num) / 10 ** decimal;
}

export function isAddress(address: string) {
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
}

export function shortenAmount(str: string | number, num = 7) {
  return Number(str.toString().substring(0, num));
}
