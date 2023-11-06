import TelegramBot from "node-telegram-bot-api";
import {
  HELP_MESSAGE,
  PREMIUM_MESSAGE,
  START_MESSAGE,
} from "../utils/replyMessage";
import {
  IMPORT_WALLET,
  FEATURES_PREMIUM,
  FEATURES_WALLET,
  CREATE_WALLET,
  REMOVE_WALLET,
} from "../utils/constants";
import {
  PREMIUM_BUTTONS,
  START_BUTTONS,
  WALLET_BUTTONS,
} from "../utils/replyButton";
import { TeleService } from "../servises/tele.service";

export class TeleBot {
  private readonly bot: TelegramBot;
  private teleService: TeleService;

  constructor(teleId: string) {
    this.bot = new TelegramBot(teleId, { polling: true });
    this.teleService = new TeleService();
  }

  init() {
    console.log(`🤖 Telegram bot is running`);
    this.bot.setMyCommands([
      {
        command: "/start",
        description: "Start using Tigon bot",
      },
      {
        command: "/wallet",
        description: "Show your wallet information",
      },
      {
        command: "/help",
        description: "List all command of bot",
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
      if (!msg.from) return;
      this.teleService.commandStart(msg.from);
      this.bot.sendMessage(msg.chat.id, START_MESSAGE, START_BUTTONS);
    });

    this.bot.onText(/\/wallet/, async (msg) => {
      const id = msg.from?.id;
      if (!id) return;

      const text = await this.teleService.commandWallet(id);
      this.bot.sendMessage(msg.chat.id, text, WALLET_BUTTONS);
    });
  }

  handleCallback() {
    this.bot.on("callback_query", async (query) => {
      const action = query.data;
      const msg = query.message;
      if (!msg) return;

      switch (action) {
        case FEATURES_WALLET: {
          const id = msg.from?.id;
          if (!id) return;

          const text = await this.teleService.commandWallet(id);
          return this.bot.sendMessage(msg.chat.id, text, WALLET_BUTTONS);
        }

        case FEATURES_PREMIUM: {
          this.bot.sendMessage(msg.chat.id, PREMIUM_MESSAGE, PREMIUM_BUTTONS);
          break;
        }

        case IMPORT_WALLET: {
          const replyMsg = await this.bot.sendMessage(
            msg.chat.id,
            "Imput your secret key or mnemonic here:",
            { reply_markup: { force_reply: true } },
          );

          const chatId = replyMsg.chat.id;
          this.bot.onReplyToMessage(
            chatId,
            replyMsg.message_id,
            async (msg) => {
              if (!msg.from?.id || !msg.text) return;
              const text = await this.teleService.importWallet(
                msg.from.id,
                msg.text,
              );
              this.bot.sendMessage(chatId, text);
            },
          );
        }

        case REMOVE_WALLET: {
        }

        case CREATE_WALLET: {
          const acc = await this.teleService.createWallet(query.from.id);
          return this.bot.sendMessage(
            msg.chat.id,
            `Created successfully: \n 💠 ***${acc.address}*** \n\n And please store your mnemonic phrase in safe place: \n 💠 ***${acc.mnemonic?.phrase}***`,
            { parse_mode: "Markdown", disable_web_page_preview: true },
          );
        }

        default:
          this.bot.sendMessage(msg.chat.id, "unknown command");
          break;
      }
    });
  }
}
