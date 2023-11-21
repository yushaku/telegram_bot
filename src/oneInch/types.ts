export type Short = {
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
