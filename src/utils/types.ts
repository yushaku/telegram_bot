import { TransactionResponse } from "@ethersproject/providers";
import { Token, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v3-sdk";

export interface Account {
  privateKey: string;
  mnemonic: string;
  address: string;
}

export type UserEntity = {
  name: string;
  accounts: Account[];
};

export function isTransaction(
  tx: TransactionResponse | any,
): tx is TransactionResponse {
  return (tx as TransactionResponse).hash !== undefined;
}

export type TokenTrade = Trade<Token, Token, TradeType>;
