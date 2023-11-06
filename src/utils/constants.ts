export const {
  TELE_BOT_ID = "",
  SERVER_URL = "",
  INFURA_ID = "",
  ETHERSCAN_ID = "",
} = process.env;

export const TELEGRAM_API = `https://api.telegram.org/bot${TELE_BOT_ID}`;
export const URI = `webhook/${TELE_BOT_ID}`;
export const WEBHOOK_URL = SERVER_URL + URI;
export const CRYPTO_API = "https://min-api.cryptocompare.com/data/price?fsym";

export const FEATURES_PREMIUM = "premium";

export const FEATURES_WALLET = "wallet feature";
export const IMPORT_WALLET = "import_wallet";
export const CREATE_WALLET = "create_wallet";
export const REMOVE_WALLET = "remove_wallet";
