export type ParseLog = {
  name: string;
  decimals: number;
  symbol: string;
  amount: number;
  from: string;
  to: string;
  address: string;
};

export type EtherscanHistory = {
  status: string;
  message: string;
  result: EtherscanResult[];
};

export type EtherscanResult = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
};

export type AnalysisTrade = {
  hash: string;
  address: string;
  symbol: string;
  amount: number;
  price: number;
  total: number;
  timestamp: Date;
  action: "BUY" | "SELL";
};

export type AnalysisHistory = {
  hash: string;
  blockNumber: string;
  from: string;
  to: string;
  value: string;
  timestamp: Date;
};
