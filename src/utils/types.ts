import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";

export interface Account {
  privateKey: string;
  mnemonic?: string | null | undefined;
  address: string;
}

export type UserEntity = {
  name: string;
  accounts: Account[];
  mainAccount: Account | null;
  slippage: number;
  maxGas: number;
};

export function isTransaction(
  tx: TransactionResponse | any,
): tx is TransactionResponse {
  return (tx as TransactionResponse).hash !== undefined;
}

export function isTransactionReceipt(
  tx: TransactionReceipt | any,
): tx is TransactionReceipt {
  return (tx as TransactionReceipt).transactionHash !== undefined;
}
