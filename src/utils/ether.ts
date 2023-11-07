import { Wallet } from "ethers";

export function parseKey(seedPhrase: string = "") {
  return seedPhrase.includes(" ")
    ? Wallet.fromPhrase(seedPhrase)
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

export function bigintToNumber(num: number | bigint, decimal = 18) {
  return Number(num) / 10 ** decimal;
}
