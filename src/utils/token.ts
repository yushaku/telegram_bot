// do not auto format this file anymore.
// check .prettierignore

import { Token, ChainId, WETH9 } from "@uniswap/sdk-core";
import { env } from "./constants";

export const SKSYNC = 280
export const chainId = env.NODE_ENV === 'TESTNET' ? ChainId.GOERLI : ChainId.MAINNET 

export const MAIN_ETH = WETH9[chainId]
export const MAIN_DAI = new Token(ChainId.MAINNET, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18);
export const MAIN_WETH = new Token(ChainId.MAINNET, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);
export const MAIN_USDC = new Token(ChainId.MAINNET, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6)
export const MAIN_ARS = new Token(ChainId.MAINNET, "0x042844589E4735cf8dEc1f48Cd4dEF37871c612e", 18)
export const MAIN_UNI = new Token(ChainId.MAINNET, "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 18)

export const ZKSYNC_USDC = new Token(SKSYNC, "0x0faF6df7054946141266420b43783387A78d82A9", 6)
export const ZKSYNC_WEAV = new Token(SKSYNC, "0xA4c011A4C65b01198a2FF314B7557bB0C798BFB8", 18)

export const GOERLI_WETH = new Token(ChainId.GOERLI, "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", 18);
export const GOERLI_UNI = new Token(ChainId.GOERLI, "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", 18);

export const WETH = env.NODE_ENV === 'TESTNET' ? GOERLI_WETH : MAIN_WETH 
export const UNI = env.NODE_ENV === 'TESTNET' ? GOERLI_UNI : MAIN_UNI 


// 0x1F98431c8aD98523631AE4a59f267346ea31F984 
export const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
export const POOL_FACTORY_CONTRACT_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
export const QUOTER_CONTRACT_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"
export const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
export const WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

export const WETH_ABI = [
  'function deposit() payable',         // Wrap ETH
  'function withdraw(uint wad) public', // Unwrap ETH
]

// Transactions
export const MAX_FEE_PER_GAS                      = 100000000000
export const MAX_PRIORITY_FEE_PER_GAS             = 100000000000
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000


