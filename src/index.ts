import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import request from "request";
import { CRYPTO_API, TELE_BOT_ID } from "./utils/constants";
import axios from "axios";

const bot = new TelegramBot(TELE_BOT_ID, { polling: true });
export function telebot() {
  bot.setMyCommands([
    {
      command: "/help",
      description: "list all command of bot",
    },
    {
      command: "/price eth",
      description: "get price of all token",
    },
    {
      command: "/assets",
      description: "display your assets",
    },
  ]);

  bot.onText(/\/help/, (msg) => {
    const message = `
    👋 I am iCrypto 🤖. I am an AI bot, a crypto guru which helps identify alpha-bearing and discover token's growth potential. All in ONE touch.

    “Onchain Revolution | Social Discovery by iCrypto AI Bot“

    Telegram (EN): https://t.me/onchaindatafi
    Twitter (EN): https://twitter.com/onchaindatafi

    ----------------

    ✅ One Touch to Open all Token Insights

    Token Report & Analysis: Discover 360 degrees of a token with insightful deep dive.

    - On-chain: Details about the token you're interested in. 
    You'll get insights on special wallet label's performance and activities, and also their impacts on token’s price correlation.
    - Social Capture: Trend + Sentiment for any token.

    ✅ Insight Highlights
    Extract & analyze token's on-chain notable stats

    - Most Visited
    - Hot Social 24H 
    - Bluechip
    - Accumulated 7D 
    - Hot LPs

    One Touch, for Alpha Signals, for Smart Traders! 🚀  
`;

    bot.sendMessage(msg.chat.id, message, { parse_mode: "Markdown" });
  });

  bot.onText(/\/price (.+)/, async (msg, match) => {
    let currency = (match?.at(1) ?? "eth").toUpperCase();

    const res = await axios.get(`${CRYPTO_API}=${currency}&tsyms=BTC,USD,EUR`);
    //   {
    //   BTC: 0.0604,
    //   USD: 1666.41,
    //   EUR: 1591.82
    // }
    console.log(msg);

    const message = `
    🪙 ETH price in USD is 💵 ${res.data?.USD ?? "unknown"}
    🪙 ETH price in EUR is 💶 ${res.data?.EUR ?? "unknown"}
    🪙 ETH price convert to BCải thảo xàoTC is ${res.data.BTC}
  `;

    bot.sendMessage(msg.chat.id, message);
  });

  bot.on("sticker", async (msg) => {
    const path = "../package.json";
    const file = fs.createReadStream(path);

    // bot.sendSticker(msg.chat.id, "http://i.imgur.com/VRYdhuD.png");
    bot.sendDocument(msg.chat.id, file);
  });

  bot.onText(/\/love/, (msg) => {
    bot.sendMessage(msg.chat.id, "are you love me?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yes, absolutely",
              callback_data: "yes",
            },
            {
              text: "No, you are suck",
              callback_data: "no",
            },
          ],
        ],
      },
    });
  });

  bot.on("callback_query", (query) => {
    const action = query.data;
    const msg = query.message;

    switch (action) {
      case "yes":
        bot.sendMessage(msg?.chat.id ?? "", "i love you too ❤️❤️❤️❤️");
        break;

      case "no":
        bot.sendMessage(msg?.chat.id ?? "", "you break my heart 😢😢😢");
        break;

      default:
        console.log("it run into other");
        break;
    }
  });

  // Handle the /menu command
  bot.onText(/\/menu/, (msg) => {
    const menuKeyboard = {
      reply_markup: {
        keyboard: [["Option 1", "Option 2"]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    const chatId = msg.chat.id;
    bot.sendDice(chatId);
  });

  // Matches /audio
  bot.onText(/\/audio/, (msg) => {
    // From HTTP request
    const url =
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg";
    const audio = request(url);
    bot.sendAudio(msg.chat.id, audio);
  });

  // Matches /echo [whatever]
  bot.onText(/\/echo (.+)/, (msg, match) => {
    const resp = match?.at(1);
    resp && bot.sendMessage(msg.chat.id, resp);
  });

  // Matches /editable
  bot.onText(/\/editable/, (msg) => {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Edit Text",
              // we shall check for this value when we listen
              // for "callback_query"
              callback_data: "edit",
            },
          ],
        ],
      },
    };
    bot.sendMessage(msg.from?.id ?? "", "Original Text", opts);
  });

  console.log(`🦊 Telegram bot is running`);
}
