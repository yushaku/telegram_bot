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
  LIST_WALLET,
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

    // this.bot.onText(/\/premium/, (msg) => {
    //   this.bot.sendMessage(msg.chat.id, PREMIUM_MESSAGE, PREMIUM_BUTTONS);
    // });

    // this.bot.onText(/\/price/, async (msg) => {
    //   const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
    //   const text = await this.teleService.getBlock();
    //   this.bot.editMessageText(text, {
    //     chat_id: sent.chat.id,
    //     message_id: sent.message_id,
    //   });
    // });

    this.bot.onText(/\/start/, (msg) => {
      if (!msg.from) return;
      this.teleService.commandStart(msg.from);
      this.bot.sendMessage(msg.chat.id, START_MESSAGE, START_BUTTONS);
    });

    this.bot.onText(/\/wallet/, async (msg) => {
      const id = msg.from?.id;
      if (!id) return;

      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const text = await this.teleService.commandWallet(id);
      this.bot.editMessageText(text, {
        chat_id: sent.chat.id,
        message_id: sent.message_id,
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
      });
    });
  }

  handleCallback() {
    this.bot.on("callback_query", async (query) => {
      const action = query.data;
      const msg = query.message;
      const userId = msg?.from?.id;
      const chatId = msg?.chat.id;

      if (!msg || !action || !userId || !chatId) return;

      if (action.match(/(remove|detail) (\S+)/g)) {
        const [type, address] = action.split(" ");

        switch (type) {
          case "detail": {
            break;
          }

          case "remove": {
            const sent = await this.bot.sendMessage(
              chatId,
              "⚠️  Are you sure?  type 'yes' to confirm ⚠️",
              { reply_markup: { force_reply: true } },
            );

            return this.bot.onReplyToMessage(
              chatId,
              sent.message_id,
              async (msg) => {
                if (!msg.from?.id || msg?.text !== "yes") return;
                const text = await this.teleService.deleteWallet(
                  msg.from.id,
                  address,
                );
                return this.bot.sendMessage(chatId, text);
              },
            );
          }

          default:
            this.bot.sendMessage(chatId, "Unknown command");
            break;
        }

        return;
      }

      switch (action) {
        case FEATURES_WALLET: {
          const text = await this.teleService.commandWallet(userId);
          return this.bot.sendMessage(chatId, text, WALLET_BUTTONS);
        }

        case FEATURES_PREMIUM: {
          this.bot.sendMessage(chatId, PREMIUM_MESSAGE, PREMIUM_BUTTONS);
          break;
        }

        case IMPORT_WALLET: {
          const replyMsg = await this.bot.sendMessage(
            chatId,
            "Imput your secret key or mnemonic here:",
            {
              reply_markup: { force_reply: true },
            },
          );

          return this.bot.onReplyToMessage(
            replyMsg.chat.id,
            replyMsg.message_id,
            async (msg) => {
              if (!msg.from?.id || !msg.text) return;
              const text = await this.teleService.importWallet(
                msg.from.id,
                msg.text,
              );
              this.bot.sendMessage(replyMsg.chat.id, text);
            },
          );
        }

        case CREATE_WALLET: {
          const acc = await this.teleService.createWallet(query.from.id);
          return this.bot.sendMessage(
            chatId,
            `💠 Created successfully: \n ***${acc.address}*** \n\n 💠And please store your mnemonic phrase in safe place: \n ***${acc.mnemonic?.phrase}***`,
            { parse_mode: "Markdown", disable_web_page_preview: true },
          );
        }

        case LIST_WALLET: {
          const btns = await this.teleService.listWallet(query.from.id);
          return this.bot.sendMessage(chatId, "Account List", btns);
        }

        default:
          this.bot.sendMessage(chatId, "unknown command");
          break;
      }
    });
  }
}
