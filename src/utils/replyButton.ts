import TelegramBot from "node-telegram-bot-api";

import {
  IMPORT_WALLET,
  FEATURES_WALLET,
  CREATE_WALLET,
  REMOVE_WALLET,
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
          text: "PreSales",
          callback_data: "yes",
        },
        {
          text: "Copytrade",
          callback_data: "no",
        },
      ],
      [
        {
          text: "God mode",
          callback_data: "yes",
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
        { text: "Remove Wallet", callback_data: REMOVE_WALLET },
      ],
    ],
  },
};
