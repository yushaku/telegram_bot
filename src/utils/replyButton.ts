import TelegramBot from "node-telegram-bot-api";

import { chainId } from "./token";
import { ChainId, WETH9 } from "@uniswap/sdk-core";
import {
  FEATURES_WALLET,
  SET_SPLIPAGE,
  SET_MAX_GAS,
  IMPORT_WALLET,
  CREATE_WALLET,
  LIST_WALLET,
  CLOSE,
  CHANGE_INPUT_TOKEN_CUSTOM,
} from "./replyTopic";
import { UNI_GOERLI, UNI_MAINNET } from "@uniswap/smart-order-router";

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
      [{ text: "Pick an wallet to trade", callback_data: LIST_WALLET }],
    ],
  },
};

export const TOKENS_BUTTONS: TelegramBot.SendMessageOptions =
  chainId === ChainId.MAINNET
    ? {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "USDC",
                callback_data: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              {
                text: "USDT",
                callback_data: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
              },
              {
                text: "DAI",
                callback_data: "0x6b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                text: "TUSD",
                callback_data: "0x0000000000085d4780B73119b644AE5ecd22b376",
              },
            ],
            [
              {
                text: "WETH",
                callback_data: WETH9[chainId].address,
              },
              {
                text: "WBTC",
                callback_data: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
              },
            ],
            [
              {
                text: "TRON",
                callback_data: "0x50327c6c5a14DCaDE707ABad2E27eB517df87AB5",
              },
              {
                text: "LINK",
                callback_data: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
              },
              {
                text: "BNB",
                callback_data: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
              },
            ],
            [
              {
                text: "MATIC",
                callback_data: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
              },
              {
                text: "UNI",
                callback_data: UNI_MAINNET.address,
              },
              {
                text: "LEO",
                callback_data: "0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3",
              },
            ],
            [{ text: "✖️  Close", callback_data: CLOSE }],
          ],
        },
      }
    : {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📀 WETH TEST",
                callback_data: WETH9[chainId].address,
              },
              {
                text: "🦄 UNI TEST",
                callback_data: UNI_GOERLI.address,
              },
            ],
            [{ text: "✖️  Close", callback_data: CLOSE }],
          ],
        },
      };

export const CHANGE_SWAP_INPUT_TOKEN: TelegramBot.SendMessageOptions =
  chainId === ChainId.MAINNET
    ? {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "USDC",
                callback_data:
                  "change_input_token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              {
                text: "USDT",
                callback_data:
                  "change_input_token 0xdAC17F958D2ee523a2206206994597C13D831ec7",
              },
              {
                text: "DAI",
                callback_data:
                  "change_input_token 0x6b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                text: "TUSD",
                callback_data:
                  "change_input_token 0x0000000000085d4780B73119b644AE5ecd22b376",
              },
            ],
            [
              {
                text: "WETH",
                callback_data: `change_input_token ${WETH9[chainId].address}`,
              },
              {
                text: "WBTC",
                callback_data:
                  "change_input_token 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
              },
            ],
            [
              {
                text: "TRON",
                callback_data:
                  "change_input_token 0x50327c6c5a14DCaDE707ABad2E27eB517df87AB5",
              },
              {
                text: "LINK",
                callback_data:
                  "change_input_token 0x514910771AF9Ca656af840dff83E8264EcF986CA",
              },
              {
                text: "BNB",
                callback_data:
                  "change_input_token 0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
              },
            ],
            [
              {
                text: "MATIC",
                callback_data:
                  "change_input_token 0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
              },
              {
                text: "UNI",
                callback_data: `change_input_token ${UNI_MAINNET.address}`,
              },
              {
                text: "LEO",
                callback_data:
                  "change_input_token 0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3",
              },
            ],
            [
              {
                text: "✏️  Custom",
                callback_data: CHANGE_INPUT_TOKEN_CUSTOM,
              },
              { text: "✖️  Close", callback_data: CLOSE },
            ],
          ],
        },
      }
    : {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📀 WETH TEST",
                callback_data: `change_input_token ${WETH9[chainId].address}`,
              },
              {
                text: "🦄 UNI TEST",
                callback_data: `change_input_token ${UNI_GOERLI.address}`,
              },
            ],
            [
              {
                text: "✏️  Custom",
                callback_data: CHANGE_INPUT_TOKEN_CUSTOM,
              },
              { text: "✖️  Close", callback_data: CLOSE },
            ],
          ],
        },
      };

export const CLOSE_BUTTON = {
  reply_markup: {
    inline_keyboard: [[{ text: "✖️  Close", callback_data: CLOSE }]],
  },
};
