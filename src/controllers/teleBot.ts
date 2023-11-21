import TelegramBot from "node-telegram-bot-api";
import { START_MESSAGE } from "../utils/replyMessage";
import {
  IMPORT_WALLET,
  FEATURES_WALLET,
  CREATE_WALLET,
  LIST_WALLET,
  SET_SPLIPAGE,
  SET_MAX_GAS,
  CLOSE,
  INIT_POOL,
} from "../utils/constants";
import {
  START_BUTTONS,
  TOKENS_BUTTONS,
  WALLET_BUTTONS,
} from "../utils/replyButton";
import { TeleService } from "../servises/tele.service";
import { isAddress, shortenAddress } from "../utils/utils";
import { isTransaction } from "../utils/types";
import { UniswapService } from "../servises/uniswap.service";
import { OneInchService } from "servises/oneInch.service";

export class TeleBot {
  private readonly bot: TelegramBot;
  private teleService: TeleService;
  private uniswapService: UniswapService;
  private oneInch: OneInchService;

  constructor(teleId: string) {
    this.bot = new TelegramBot(teleId, { polling: true });
    this.teleService = new TeleService();
    this.uniswapService = new UniswapService();
    this.oneInch = new OneInchService();
  }

  init() {
    console.log(`🤖 Telegram bot is running`);
    this.bot.setMyCommands([
      {
        command: "/trade",
        description: "trading from weth to uni",
      },
      {
        command: "/route",
        description: "use route to swap weth -> uni",
      },
      {
        command: "/pool",
        description: "create pools",
      },
      {
        command: "/sniper",
        description: "Summons the Tigon bot main panel",
      },
      {
        command: "/tokens",
        description: "List some tokens",
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

    this.bot.onText(/\/pool/, async (msg) => {
      if (!msg.from) return;
      const sent = await this.bot.sendMessage(
        msg.chat.id,
        "Fetching your pools",
      );

      this.oneInch.test("0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1");
    });

    this.bot.onText(/\/trade/, async (msg) => {
      if (!msg.from) return;
      const sent = await this.bot.sendMessage(
        msg.chat.id,
        "Swap from WETH to UNI",
      );
      const text = await this.teleService.hi(msg.from.id);
      this.bot.editMessageText(text ?? "hello", {
        message_id: sent.message_id,
        chat_id: sent.chat.id,
        parse_mode: "Markdown",
      });
    });

    this.bot.onText(/\/route/, async (msg) => {
      if (!msg.from) return;
      const sent = await this.bot.sendMessage(
        msg.chat.id,
        "create route from WETH to UNI",
      );
      const text = await this.teleService.hello(msg.from.id);
      this.bot.editMessageText(text ?? "hello", {
        message_id: sent.message_id,
        chat_id: sent.chat.id,
        parse_mode: "Markdown",
      });
    });

    this.bot.onText(/\/get (.+)/, async (msg, match) => {
      const resp = match?.at(1);
      if (!msg.from || !resp) return;
      const a = await this.uniswapService.checkhash(resp);
      console.log(a);

      // const data = await this.teleService.conichiwa(msg.from.id);
      // if (!data) return;
      // const { text, buttons } = data;
      const sent = await this.bot.sendMessage(
        msg.chat.id,
        `check ${a?.status}`,
      );
    });

    this.bot.onText(/\/tokens/, async (msg) => {
      if (!msg.from) return;
      const acc = await this.teleService.getAccount(msg.from.id);
      this.bot.sendMessage(
        msg.chat.id,
        `💰 Introducing our fast buy menu\nPurchase tokens with a single click.\nOur system uses w1 only and private transactions \nto safeguard against MEV attacks \n\n📈 Trading on account: \`${shortenAddress(
          acc?.address,
          6,
        )}\``,
        TOKENS_BUTTONS,
      );
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
            [{ text: "Pick an wallet to trade", callback_data: LIST_WALLET }],
          ],
        },
      });
    });
  }

  handleCallback() {
    this.bot.on("callback_query", async (query) => {
      const action = query.data;
      const msg = query.message;
      const userId = query?.from?.id;
      const chatId = msg?.chat.id;

      if (!msg || !action || !userId || !chatId) return;

      // NOTE: handle user send address of token
      if (isAddress(action)) {
        const { text, buttons } = await this.teleService.checkToken({
          address: action,
          userId,
        });
        return this.bot.sendMessage(chatId, text, {
          parse_mode: "Markdown",
          disable_web_page_preview: false,
          ...buttons,
        });
      }

      // NOTE: handle callback specific function
      if (
        action.match(
          /(remove_wallet|detail_wallet|buy_custom|confirm_swap) (\S+)/g,
        )
      ) {
        const [type, address] = action.split(" ");

        switch (type) {
          case "detail_wallet": {
            const sent = await this.bot.sendMessage(chatId, "processing...");
            const { text, buttons } = await this.teleService.getDetails({
              wallet: address,
              userId: userId,
            });

            this.bot.editMessageText(text, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...buttons,
            });
            break;
          }

          case "remove_wallet": {
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

          case "buy_custom": {
            const sent = await this.bot.sendMessage(
              chatId,
              "✏️  Enter a custom buy amount. Greater or equal to 0.01",
              { reply_markup: { force_reply: true } },
            );

            return this.bot.onReplyToMessage(
              chatId,
              sent.message_id,
              async (msg) => {
                if (!msg.from?.id) return;
                if (Number(msg.text) >= 0.01) {
                  const sent = await this.bot.sendMessage(
                    chatId,
                    "Estimate your price...",
                  );
                  const { text, buttons } =
                    await this.teleService.estimatePrice({
                      userId: msg.from.id,
                      amount: Number(msg.text),
                      tokenAddress: address,
                    });
                  return this.bot.editMessageText(text, {
                    chat_id: sent.chat.id,
                    message_id: sent.message_id,
                    parse_mode: "Markdown",
                    ...buttons,
                  });
                } else {
                  return this.bot.sendMessage(chatId, "Invalid custom amount");
                }
              },
            );
          }

          case "confirm_swap": {
            if (!query.message) return;
            const sent = await this.bot.editMessageText("processing...", {
              chat_id: chatId,
              message_id: query.message.message_id,
            });

            if (typeof sent === "boolean") return;

            let result = await this.teleService.confirmSwap({
              id: address,
              userId,
            });

            let sent2: TelegramBot.Message;
            if (isTransaction(result)) {
              sent2 = this.bot.editMessageText(
                `Transaction is pending ${result.hash}`,
                {
                  chat_id: sent.chat.id,
                  message_id: sent.message_id,
                },
              ) as unknown as TelegramBot.Message;

              const received = await result.wait();
              result = `Transaction Success! ${received.transactionHash}`;

              return this.bot.editMessageText(result, {
                chat_id: sent.chat.id,
                message_id: sent.message_id,
              });
            }

            this.bot.editMessageText(result, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
            });
          }

          default:
            this.bot.sendMessage(chatId, "Unknown command");
            break;
        }

        return;
      }

      // NOTE: handle buttons function
      switch (action) {
        case FEATURES_WALLET: {
          const text = await this.teleService.commandWallet(userId);
          return this.bot.sendMessage(chatId, text, WALLET_BUTTONS);
        }

        case INIT_POOL: {
          const a = await this.teleService.initPool(query.from.id);
          return this.bot.sendMessage(chatId, "ok");
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

        case CLOSE: {
          if (!query.message) return;
          return this.bot.deleteMessage(chatId, query.message.message_id);
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
