import { z } from "zod";
import { Protocol } from "@uniswap/router-sdk";
import { chainId } from "./token";

const envSchema = z.object({
  TELE_BOT_ID: z.string(),
  SERVER_URL: z.string(),
  INFURA_KEY: z.string().nonempty(),
  ETHERSCAN_ID: z.string().nonempty(),
  ONE_INCH_KEY: z.string().nonempty(),
});

export const {
  TELE_BOT_ID,
  SERVER_URL,
  INFURA_KEY,
  ETHERSCAN_ID,
  ONE_INCH_KEY,
} = envSchema.parse(process.env);

export const BROADCAST_API_URL = `https://api.1inch.dev/tx-gateway/v1.1/${chainId}/broadcast/`;
export const API_BASE_URL = `https://api.1inch.dev/swap/v5.2/${chainId}/`;

export const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
};

export const BIPS_BASE = 10_000;
export const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED];

export const TELEGRAM_API = `https://api.telegram.org/bot${TELE_BOT_ID}`;
export const URI = `webhook/${TELE_BOT_ID}`;
export const WEBHOOK_URL = SERVER_URL + URI;
export const CRYPTO_API = "https://min-api.cryptocompare.com/data/price?fsym";

export const V2_SWAP_ROUTER_ADDRESS =
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const QUOTER_CONTRACT_ADDRESS =
  "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
export const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const WETH_CONTRACT_ADDRESS =
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS =
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
export const UNIVERCAL_ROUTER_ADDRESS =
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";

export const WETH_ABI = [
  "function deposit() payable", // Wrap ETH
  "function withdraw(uint wad) public", // Unwrap ETH
];

export const NONFUNGIBLE_POSITION_MANAGER_ABI = [
  // Read-Only Functions
  "function balanceOf(address _owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address _owner, uint256 _index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string memory)",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];

// Transactions
export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;
