import { FEATURES_IMPORT_WALLET } from "./constants";

export const PREMIUM_BUTTONS = {
  reply_markup: {
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
          callback_data: "yes",
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

export const WALLET_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Import Wallet",
          callback_data: FEATURES_IMPORT_WALLET,
        },
        {
          text: "Reder QA code",
          callback_data: "qa_code",
        },
      ],
    ],
  },
};
