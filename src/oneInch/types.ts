export type Quote = {
  toAmount: string;
  fromToken: Token;
  toToken: Token;
  protocols: Array<Array<Protocol[]>>;
  gas: number;
};

export type Token = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  eip2612?: boolean;
  logoURI: string;
  tags: string[];
};

export type Protocol = {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
};

export type GasPrice = {
  baseFee: string;
  low: GasFee;
  medium: GasFee;
  high: GasFee;
  instant: GasFee;
};

export type GasFee = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

export type GenerateCalldata = {
  toAmount: string;
  tx: Tx;
};

export type Tx = {
  from: string;
  to: string;
  data: string;
  value: string;
  gas?: number;
  gasPrice?: string;
};

export type SwapParams = {
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage: string;
  includeTokensInfo: boolean;
  includeProtocols: boolean;
  includeGas: boolean;
  allowPartialFill: boolean;
  disableEstimate: boolean;
};
