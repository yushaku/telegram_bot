export const { TELE_BOT_ID = "", SERVER_URL = "" } = process.env;
export const TELEGRAM_API = `https://api.telegram.org/bot${TELE_BOT_ID}`;
export const URI = `webhook/${TELE_BOT_ID}`;
export const WEBHOOK_URL = SERVER_URL + URI;
export const CRYPTO_API = "https://min-api.cryptocompare.com/data/price?fsym";
