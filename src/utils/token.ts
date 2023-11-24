// do not auto format this file anymore.
// check .prettierignore

import { Token, ChainId, WETH9 } from "@uniswap/sdk-core";
import { NATIVE_CURRENCY, USDC_GOERLI, USDC_MAINNET } from "@uniswap/smart-order-router";
import { z } from "zod";

const CHAIN = Object.values(ChainId).filter(value => typeof value !== 'number') as string[];

const envSchema = z.object({
  NODE_ENV: z.enum([ 'LOCAL', ...CHAIN]).default("LOCAL"),
});
export const { NODE_ENV } = envSchema.parse(process.env);

function enumToMap<T extends string | number>(enumObj: Record<string, T>) {
  const map = new Map<string, number>();
  Object.keys(enumObj).forEach((key) => {
    if(typeof enumObj[key] !== 'number') return
    map.set(key, Number(enumObj[key]));
  });
  return map;
}

const chainList = enumToMap(ChainId);
export const chainId = chainList.get(NODE_ENV) ?? ChainId.GOERLI


export const MATIC_POLYGON = new Token(ChainId.POLYGON, '0x0000000000000000000000000000000000001010', 18, 'MATIC')
export const MATIC_MUMBAI = new Token(ChainId.POLYGON_MUMBAI, '0x0000000000000000000000000000000000001010', 18, 'MATIC')

export const MAIN_ETH  = WETH9[chainId]
export const MAIN_DAI  = new Token(ChainId.MAINNET, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18);
export const MAIN_WETH = new Token(ChainId.MAINNET, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);
export const MAIN_USDC = new Token(ChainId.MAINNET, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6)
export const MAIN_ARS  = new Token(ChainId.MAINNET, "0x042844589E4735cf8dEc1f48Cd4dEF37871c612e", 18)
export const MAIN_UNI  = new Token(ChainId.MAINNET, "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 18)

// export const ZKSYNC_USDC = new Token(SKSYNC, "0x0faF6df7054946141266420b43783387A78d82A9", 6)
// export const ZKSYNC_WEAV = new Token(SKSYNC, "0xA4c011A4C65b01198a2FF314B7557bB0C798BFB8", 18)
export const GOERLI_WETH = new Token(ChainId.GOERLI, "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", 18);

export const NATIVE_TOKEN = NATIVE_CURRENCY[chainId]
export const WETH = NODE_ENV === 'GOERLI' ? GOERLI_WETH : MAIN_WETH 
export const USDC = NODE_ENV === 'GOERLI' ? USDC_GOERLI : USDC_MAINNET 
export const UNI  = new Token(chainId, "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", 18) 
export const ONEINCH = new Token(chainId, "0x111111111117dC0aa78b770fA6A738034120C302", 18);


export function isWETH(address: string): boolean {
  return address === WETH9[chainId].address
}
