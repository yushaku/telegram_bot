import { z } from "zod";
import { Protocol } from "@uniswap/router-sdk";
import { chainId } from "./token";

const envSchema = z.object({
  TELE_BOT_ID: z.string(),
  INFURA_KEY: z.string(),
  ETHERSCAN_ID: z.string(),
  MORALIS_KEY: z.string(),
  ONE_INCH_KEY: z.string(),
  COIN_MARKET_KEY: z.string(),
  ETH_PLORER: z.string(),
  ALCHEMY_KEY: z.string(),
  MONGO_NAME: z.string(),
  MONGODB_URL: z.string().default("mongodb://localhost:27017"),
});

export const {
  TELE_BOT_ID,
  INFURA_KEY,
  ETHERSCAN_ID,
  ONE_INCH_KEY,
  COIN_MARKET_KEY,
  ETH_PLORER,
  ALCHEMY_KEY,
  MONGO_NAME,
  MONGODB_URL,
  MORALIS_KEY,
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

export const UNISWAP_V3_POOL = "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801";
export const UNISWAP_V2_POOL = "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801";

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

export const hashOfTransferTx =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const DEX = {
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap V3 router",
  "0x881d40237659c251811cec9c364ef91dc08d300c": "Metamask swap",
  "0xdef171fe48cf0115b1d80b88dc8eab59176fee57": "Mega swap",
};

export const DexMap = new Map(Object.entries(DEX));
