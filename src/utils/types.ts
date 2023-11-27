import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";

export interface Account {
  privateKey: string;
  mnemonic?: string | null | undefined;
  address: string;
}

export type Watchlist = { address: string; name: string };
export type WhaleList = {
  [key: string]: {
    subscribe: {
      [address: string]: number | string;
    };
  };
};

export type UserEntity = {
  name: string;
  accounts: Account[];
  watchList: Watchlist[];
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

export type EventWhaleWallet = {
  type: "add" | "remove";
  channelId: number;
  wallet: string;
};
