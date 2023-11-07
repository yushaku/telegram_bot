import TelegramBot from "node-telegram-bot-api";
import { START_MESSAGE } from "../utils/replyMessage";
import {
  IMPORT_WALLET,
  FEATURES_WALLET,
  CREATE_WALLET,
  LIST_WALLET,
  SET_SPLIPAGE,
  SET_MAX_GAS,
} from "../utils/constants";
import {
  DETAIL_WALLET_BUTTONS,
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
        command: "/sniper",
        description: "Summons the Tigon bot main panel",
      },
      {
        command: "/wallet",
        description: "Show your wallet information",
      },
    ]);
    this.listen();
    this.handleCallback();
  }

  listen() {
    this.bot.onText(/\/sniper/, (msg) => {
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
            const sent = await this.bot.sendMessage(chatId, "processing...");
            const text = await this.teleService.getDetails(address);
            this.bot.editMessageText(text, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...DETAIL_WALLET_BUTTONS,
            });
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

        case SET_MAX_GAS:
        case SET_SPLIPAGE: {
          const text =
            action === SET_MAX_GAS
              ? "✏️  Reply to this message with your desired maximum gas price (in gwei). 1 gwei = 10 ^ 9 wei. Minimum is 5 gwei!"
              : "✏️  Reply to this message with your desired slippage percentage. Minimum is 0.1%. Max is 1000%!";

          const replyMsg = await this.bot.sendMessage(chatId, text, {
            reply_markup: { force_reply: true },
          });

          return this.bot.onReplyToMessage(
            replyMsg.chat.id,
            replyMsg.message_id,
            async (msg) => {
              const num = msg.text?.match(/\d+/g)?.at(0);
              const type = action === SET_MAX_GAS ? "maxGas" : "slippage";
              if (!msg.from?.id || !num) return;

              const text = await this.teleService.setConfig(
                type,
                msg.from.id,
                Number(num),
              );
              this.bot.sendMessage(replyMsg.chat.id, text);
            },
          );
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
