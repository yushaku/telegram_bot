import TelegramBot from "node-telegram-bot-api";
import request from "request";
import { CRYPTO_API, TELE_BOT_ID } from "./utils/constants";
import axios from "axios";

const bot = new TelegramBot(TELE_BOT_ID, { polling: true });

// Matches /photo
bot.onText(/\/photo/, (msg) => {
  // From file path
  const photo = `${__dirname}/../test/data/photo.gif`;
  bot.sendPhoto(msg.chat.id, photo, {
    caption: "I'm a bot!",
  });
});

bot.onText(/\/price (.+)/, async (msg, match) => {
  let currency = (match?.at(1) ?? "eth").toUpperCase();

  const res = await axios.get(`${CRYPTO_API}=${currency}&tsyms=BTC,USD,EUR`);
  //   {
  //   BTC: 0.0604,
  //   USD: 1666.41,
  //   EUR: 1591.82
  // }
  const message = `
    ETH price in USD is $${res.data?.USD ?? "unknown"}
    ETH price in EUR is $${res.data?.EUR ?? "unknown"}
    ETH price convert to BTC is ${res.data.BTC}
  `;

  bot.sendMessage(msg.chat.id, message);
});

bot.on("sticker", (msg) => {
  return bot.sendSticker(msg.chat.id, "http://i.imgur.com/VRYdhuD.png");
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
  const url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg";
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
