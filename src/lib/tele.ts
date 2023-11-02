import TelegramBot from "node-telegram-bot-api";
import {
  HELP_MESSAGE,
  PREMIUM_MESSAGE,
  START_MESSAGE,
  WALLET_MESSAGE,
} from "../utils/replyMessage";
import {
  FEATURES_IMPORT_WALLET,
  FEATURES_PREMIUM,
  FEATURES_WALLET,
} from "../utils/constants";
import {
  PREMIUM_BUTTONS,
  START_BUTTONS,
  WALLET_BUTTONS,
} from "../utils/replyButton";

export class TeleBot {
  private readonly bot: TelegramBot;

  constructor(teleId: string) {
    this.bot = new TelegramBot(teleId, { polling: true });
  }

  init() {
    console.log(`🤖 Telegram bot is running`);
    this.bot.setMyCommands([
      {
        command: "/start",
        description: "start using Tigon bot",
      },
      {
        command: "/help",
        description: "list all command of bot",
      },
      {
        command: "/assets",
        description: "display your assets",
      },
    ]);
    this.listen();
    this.handleCallback();
  }

  listen() {
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, HELP_MESSAGE);
    });

    this.bot.onText(/\/premium/, (msg) => {
      this.bot.sendMessage(msg.chat.id, PREMIUM_MESSAGE, PREMIUM_BUTTONS);
    });

    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(msg.chat.id, START_MESSAGE, START_BUTTONS);
    });

    this.bot.onText(/\/wallet/, (msg) => {
      this.bot.sendMessage(msg.chat.id, WALLET_MESSAGE, WALLET_BUTTONS);
    });
  }

  handleCallback() {
    this.bot.on("callback_query", (query) => {
      const action = query.data;
      const msg = query.message;
      if (!msg) return;

      switch (action) {
        case FEATURES_WALLET:
          this.bot.sendMessage(msg.chat.id, WALLET_MESSAGE);
          break;

        case FEATURES_PREMIUM:
          this.bot.sendMessage(msg.chat.id, PREMIUM_MESSAGE, PREMIUM_BUTTONS);
          break;

        case FEATURES_IMPORT_WALLET:
          break;

        default:
          this.bot.sendMessage(msg.chat.id, "unknown command");
          break;
      }
    });
  }

  handleReplyMessage() {
    this.bot.on("chat_join_request", (query) => {
      console.log(query);
    });
  }
}
