import TelegramBot from "node-telegram-bot-api";

import {
  IMPORT_WALLET,
  FEATURES_WALLET,
  CREATE_WALLET,
  LIST_WALLET,
  BUY_LIMIT,
  BUY_TOKEN,
  SELL_LIMIT,
  SELL_TOKEN,
  SET_SPLIPAGE,
  SET_MAX_GAS,
} from "./constants";

export const PREMIUM_BUTTONS = {
  reply_markup: {
    force_reply: true,
    inline_keyboard: [
      [
        { text: "Pay in BNB", callback_data: "Pay in BNB" },
        { text: "Pay in ETH (ETH)", callback_data: "Pay in ETH" },
        { text: "Pay in ETH (ARB)", callback_data: "Pay in ETH" },
      ],
    ],
  },
};

export const START_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🗃️ Wallets",
          callback_data: FEATURES_WALLET,
        },
        {
          text: "Call Channels",
          callback_data: "no",
        },
      ],
      [
        {
          text: "Set Slipage",
          callback_data: SET_SPLIPAGE,
        },
        {
          text: "Set Max Gas",
          callback_data: SET_MAX_GAS,
        },
      ],
      [
        {
          text: "⭐ Premium",
          callback_data: "premium",
        },
        {
          text: " ℹ️  FAQ",
          callback_data: "FAQ",
        },
      ],
    ],
  },
};

export const WALLET_BUTTONS: TelegramBot.SendMessageOptions = {
  parse_mode: "Markdown",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Import Wallet", callback_data: IMPORT_WALLET },
        { text: "Create Wallet", callback_data: CREATE_WALLET },
      ],
      [{ text: "List Wallet", callback_data: LIST_WALLET }],
    ],
  },
};

export const DETAIL_WALLET_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Buy Token", callback_data: BUY_TOKEN },
        { text: "Sell Token", callback_data: SELL_TOKEN },
      ],
      [
        { text: "Buy Limit", callback_data: BUY_LIMIT },
        { text: "Sell Limit", callback_data: SELL_LIMIT },
      ],
      [
        { text: "Token Balance", callback_data: "Token Balance" },
        { text: "Wallet Analysis", callback_data: "Wallet Analysis" },
        { text: "Flex Pnl", callback_data: "Flex Pnl" },
      ],
    ],
  },
};
