import { z } from "zod";

export const {
  TELE_BOT_ID = "",
  SERVER_URL = "",
  INFURA_ID = "",
  ETHERSCAN_ID = "",
} = process.env;

const envSchema = z.object({
  NODE_ENV: z.enum(["TESTNET", "MAINNET", "ZKSYNC"]).default("TESTNET"),
  TELE_BOT_ID: z.string(),
  SERVER_URL: z.string(),
  INFURA_ID: z.string().nonempty(),
  ETHERSCAN_ID: z.string().nonempty(),
});

export const env = envSchema.parse(process.env);

export const BASE_SCANNER =
  env.NODE_ENV === "TESTNET"
    ? "https://goerli.infura.io/v3"
    : "https://mainnet.infura.io/v3";

export const TELEGRAM_API = `https://api.telegram.org/bot${TELE_BOT_ID}`;
export const URI = `webhook/${TELE_BOT_ID}`;
export const WEBHOOK_URL = SERVER_URL + URI;
export const CRYPTO_API = "https://min-api.cryptocompare.com/data/price?fsym";

export const FEATURES_PREMIUM = "premium";
export const SET_SPLIPAGE = "set_splipage";
export const SET_MAX_GAS = "set_max_gas";
export const INIT_POOL = "create_position_uni";

export const FEATURES_WALLET = "wallet feature";
export const IMPORT_WALLET = "import_wallet";
export const CREATE_WALLET = "create_wallet";
export const LIST_WALLET = "list_wallet";

export const BUY_TOKEN = "buy_token";
export const BUY_LIMIT = "buy_limit";
export const SELL_TOKEN = "sell_token";
export const SELL_LIMIT = "sell_limit";

export const CLOSE = "close";
