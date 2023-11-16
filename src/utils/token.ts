// do not auto format this file anymore.
// check .prettierignore

import { Token, ChainId, WETH9 } from "@uniswap/sdk-core";
import { NATIVE_CURRENCY, USDC_GOERLI, USDC_MAINNET } from "@uniswap/smart-order-router";
import { env } from "bun";
import { NODE_ENV } from "./constants";

export const SKSYNC = 280
export const chainId = NODE_ENV === 'TESTNET' ? ChainId.GOERLI : ChainId.MAINNET 

export const MATIC_POLYGON = new Token(ChainId.POLYGON, '0x0000000000000000000000000000000000001010', 18, 'MATIC')
export const MATIC_MUMBAI = new Token(ChainId.POLYGON_MUMBAI, '0x0000000000000000000000000000000000001010', 18, 'MATIC')

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
export const GOERLI_YUSHAKU = new Token(ChainId.GOERLI, "0x461d35B87F3271c42bE1f553930aeddda6c2F53b", 18);

export const NATIVE_TOKEN = NATIVE_CURRENCY[chainId]
export const WETH = env.NODE_ENV === 'TESTNET' ? GOERLI_WETH : MAIN_WETH 
export const UNI  = env.NODE_ENV === 'TESTNET' ? GOERLI_UNI : MAIN_UNI 
export const USDC = env.NODE_ENV === 'TESTNET' ? USDC_GOERLI : USDC_MAINNET 


// 0x1F98431c8aD98523631AE4a59f267346ea31F984 
export const V2_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
export const POOL_FACTORY_CONTRACT_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
export const QUOTER_CONTRACT_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"
export const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
export const WETH_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
export const UNIVERCAL_ROUTER_ADDRESS = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"

export const WETH_ABI = [
  'function deposit() payable',         // Wrap ETH
  'function withdraw(uint wad) public', // Unwrap ETH
]

export const NONFUNGIBLE_POSITION_MANAGER_ABI = [
  // Read-Only Functions
  'function balanceOf(address _owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address _owner, uint256 _index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
]


// Transactions
export const MAX_FEE_PER_GAS                      = 100000000000
export const MAX_PRIORITY_FEE_PER_GAS             = 100000000000
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000
