import { TeleService } from "TeleService";
import { isAddress } from "ethers/lib/utils";
import TelegramBot from "node-telegram-bot-api";
import { CLOSE_BUTTON, TOKENS_BUTTONS, WALLET_BUTTONS } from "utils/replyButton";
import {
  WHALE_WALLET_ADD,
  LIST_TOKEN,
  CLOSE,
  CREATE_WALLET,
  FEATURES_WALLET,
  IMPORT_WALLET,
  INIT_POOL,
  LIST_WALLET,
  SET_MAX_GAS,
  SET_SPLIPAGE,
  NO_CALLBACK,
  CHANGE_INPUT_CURRENCY,
  CHANGE_INPUT_TOKEN_CUSTOM,
  LIST_TRACK_WALLET,
} from "utils/replyTopic";
import { Tracker } from "./tracker";
import { listTokensMsg } from "./utils/replyMessage";

export class TeleBot {
  private readonly bot: TelegramBot;
  private teleService: TeleService;
  private tracker: Tracker;

  constructor(teleId: string) {
    this.bot = new TelegramBot(teleId, { polling: true });
    this.teleService = new TeleService();
    this.tracker = new Tracker(this.bot);
  }

  async init() {
    this.bot.setMyCommands([
      {
        command: "/watch",
        description: "follows the shark and whale",
      },
      {
        command: "/wallets",
        description: "Manager your wallets",
      },
      {
        command: "/tokens",
        description: "List some tokens",
      },
      {
        command: "/start",
        description: "Show your wallet information",
      },
    ]);
    this.listen();
    this.handleCallback();
    this.tracker.trackWhaleWallet();
  }

  listen() {
    this.bot.onText(/\/test/, (msg) => {
      this.bot.sendMessage(msg.chat.id, "Testing");
    });

    // MARK: /watch whale's wallet
    this.bot.onText(/\/watch/, async (msg) => {
      const id = msg.from?.id;
      if (!id) return;

      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const { text, buttons } = await this.teleService.whaleList(id);
      this.bot.editMessageText(text, {
        chat_id: sent.chat.id,
        message_id: sent.message_id,
        reply_markup: buttons,
      });
    });

    // MARK: /tokens command
    this.bot.onText(/\/tokens/, async (msg) => {
      if (!msg.from) return;
      const acc = await this.teleService.getAccount(msg.from.id);
      this.bot.sendMessage(msg.chat.id, listTokensMsg(acc?.address), TOKENS_BUTTONS);
    });

    // MARK: /start command
    this.bot.onText(/\/start/, async (msg) => {
      const user = msg.from;
      if (!user) return;

      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const text = await this.teleService.commandStart(user);

      return this.bot.editMessageText(text, {
        chat_id: sent.chat.id,
        message_id: sent.message_id,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "My Wallets", callback_data: FEATURES_WALLET },
              { text: "Tracking Wallets", callback_data: LIST_TRACK_WALLET },
            ],
            [{ text: "Trade", callback_data: LIST_TOKEN }],
          ],
        },
      });
    });

    // MARK: /wallets command
    this.bot.onText(/\/wallets/, async (msg) => {
      const user = msg.from;
      if (!user) return;

      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const text = await this.teleService.commandWallet(user.id);

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

    // MARK: /address of smartcontract
    this.bot.onText(/^(0x)?[0-9a-fA-F]{40}$/, async (msg) => {
      console.log(msg);

      const address = msg.text;
      const userId = msg.from?.id;
      if (!address || !userId || msg?.reply_to_message) return;

      const { text, buttons } = await this.teleService.checkToken({
        address,
        userId,
      });
      return this.bot.sendMessage(msg.chat.id, text, {
        parse_mode: "Markdown",
        disable_web_page_preview: false,
        ...buttons,
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

      // MARK: Send address of token to swap
      if (isAddress(action)) {
        this.bot.deleteMessage(chatId, msg.message_id);
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

      //HACK: 📬 CRUD WALLET
      if (action.match(/(remove_wallet|detail_wallet|change_input_token) (\S+)/g)) {
        const [type, address] = action.split(" ");
        switch (type) {
          // MARK: Pick wallet to interact
          case "detail_wallet": {
            this.bot.deleteMessage(chatId, query?.message?.message_id ?? 0);
            const sent = await this.bot.sendMessage(chatId, "processing...");
            const { text, buttons } = await this.teleService.getDetails({
              wallet: address,
              userId: userId,
            });

            return this.bot.editMessageText(text, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...buttons,
            });
          }

          // MARK: remove user's wallet
          case "remove_wallet": {
            const sent = await this.bot.sendMessage(
              chatId,
              "⚠️  Are you sure?  type 'yes' to confirm ⚠️",
              {
                reply_markup: { force_reply: true },
              },
            );

            return this.bot.onReplyToMessage(chatId, sent.message_id, async (msg) => {
              if (!msg.from?.id || msg?.text !== "yes") return;
              const text = await this.teleService.deleteWallet(msg.from.id, address);
              return this.bot.sendMessage(chatId, text);
            });
          }

          // MARK: change input of swap
          case "change_input_token": {
            if (!query.message) return;
            this.bot.deleteMessage(chatId, query.message.message_id);
            const { text, buttons } = await this.teleService.changeSwapInputToken(userId, address);
            return this.bot.sendMessage(chatId, text, buttons);
          }
        }
      }

      //HACK: 🐳 CRUD WHALE WALLET
      if (
        action.match(
          /(whale_wallet_remove|whale_wallet_detail|holding_token|analysis_wallet) (\S+)/g,
        )
      ) {
        const [type, address] = action.split(" ");
        switch (type) {
          // MARK: remove whale's wallet
          case "whale_wallet_remove": {
            const sent = await this.bot.sendMessage(
              chatId,
              "⚠️  Are you sure?  type 'yes' to confirm ⚠️",
              {
                reply_markup: { force_reply: true },
              },
            );

            return this.bot.onReplyToMessage(chatId, sent.message_id, async (msg) => {
              if (!msg.from?.id || msg?.text !== "yes") return;
              const text = await this.teleService.removeWhaleWallet({
                userId: msg.from.id,
                address,
                channelId: chatId,
              });
              return this.bot.sendMessage(chatId, text);
            });
          }

          // MARK: get details of tracked wallet
          case "whale_wallet_detail": {
            const { text, buttons } = await this.teleService.whaleWalletDetail(address);

            return this.bot.sendMessage(chatId, text, {
              parse_mode: "Markdown",
              disable_web_page_preview: false,
              reply_markup: buttons,
            });
          }

          // MARK: whale holding's token
          case "holding_token": {
            const { text, buttons } = await this.teleService.holdingtoken(address);

            return this.bot.sendMessage(chatId, text, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_markup: buttons,
            });
          }

          // MARK: analysis whale trading
          case "analysis_wallet": {
            const sent = await this.bot.sendMessage(
              chatId,
              "Depend on wallet's history, it might take a few minutes.\nOn a way to analysis...\nPlease wait...",
            );
            const { text, buttons } = await this.teleService.analysisWallet(address);
            return this.bot.editMessageText(text, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              ...buttons,
            });
          }
        }
      }

      //HACK: 🪙 BUY/SELL TOKEN
      if (action.match(/(buy_custom|confirm_swap|sell_custom|top_holders) (\S+)/g)) {
        const [type, address] = action.split(" ");

        switch (type) {
          // MARK: buy amount of token
          case "buy_custom": {
            const { symbol } = await this.teleService.getDefaultToken(userId);
            const sent = await this.bot.sendMessage(
              chatId,
              `✏️  Enter amount of ${symbol} swap to this token. Greater or equal to 0.01`,
              { reply_markup: { force_reply: true } },
            );

            return this.bot.onReplyToMessage(chatId, sent.message_id, async (msg) => {
              if (!msg.from?.id) return;
              if (Number(msg.text) >= 0.01) {
                const sent = await this.bot.sendMessage(chatId, "Estimate your price...");

                const { text, buttons } = await this.teleService.estimate({
                  userId: msg.from.id,
                  amount: Number(msg.text),
                  tokenAddress: address,
                  type: "BUY",
                });

                return this.bot.editMessageText(text, {
                  chat_id: sent.chat.id,
                  message_id: sent.message_id,
                  parse_mode: "Markdown",
                  disable_web_page_preview: false,
                  ...buttons,
                });
              } else {
                return this.bot.sendMessage(chatId, "Invalid custom amount");
              }
            });
          }

          // MARK: confirm swap
          case "confirm_swap": {
            if (!query.message) return;
            const sent = await this.bot.editMessageText("processing...", {
              chat_id: chatId,
              message_id: query.message.message_id,
            });

            if (typeof sent === "boolean") return;
            let { text } = await this.teleService.confirmSwap({
              id: address,
              userId,
            });

            return this.bot.editMessageText(text, {
              parse_mode: "Markdown",
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "✅ Done", callback_data: NO_CALLBACK },
                    { text: "🎛️ Menu", callback_data: LIST_TOKEN },
                  ],
                ],
              },
            });
          }

          //MARK: get top holders of token
          case "top_holders": {
            const sent = await this.bot.sendMessage(chatId, "Getting top holders...");

            const { text, buttons } = await this.teleService.getTopHolders(address);
            return this.bot.editMessageText(text, {
              parse_mode: "Markdown",
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...buttons,
            });
          }

          // MARK: Sell amount of token
          case "sell_custom": {
            const { symbol } = await this.teleService.getDefaultToken(userId);
            const sent = await this.bot.sendMessage(
              chatId,
              `💎 Swap this token to receive ${symbol}\n✏️  Enter a custom sell amount.\nAmount  Greater or equal to 0.01`,
              { reply_markup: { force_reply: true } },
            );

            return this.bot.onReplyToMessage(chatId, sent.message_id, async (msg) => {
              if (!msg.from?.id) return;
              if (Number(msg.text) >= 0.01) {
                const sent = await this.bot.sendMessage(chatId, "Swap token...");

                const { text, buttons } = await this.teleService.estimate({
                  userId: msg.from.id,
                  amount: Number(msg.text),
                  tokenAddress: address,
                  type: "SELL",
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
            });
          }

          default:
            this.bot.sendMessage(chatId, "Unknown command");
            break;
        }

        return;
      }

      //HACK: ⚡ BASIC FEATURES
      switch (action) {
        // MARK: show wallet list and chain information
        case FEATURES_WALLET: {
          const text = await this.teleService.commandWallet(userId);
          return this.bot.sendMessage(chatId, text, WALLET_BUTTONS);
        }

        // TODO: Provide liquidity to pool
        case INIT_POOL: {
          return this.bot.sendMessage(chatId, "ok");
        }

        // MARK: set gas limit and slippage
        case SET_MAX_GAS:
        case SET_SPLIPAGE: {
          const text =
            action === SET_MAX_GAS
              ? "✏️  Reply to this message with your desired maximum gas price (in gwei). 1 gwei = 10 ^ 9 wei. Minimum is 5 gwei!"
              : "✏️  Reply to this message with your desired slippage percentage. Minimum is 0.1%. Max is 1000%!";

          const replyMsg = await this.bot.sendMessage(chatId, text, {
            reply_markup: { force_reply: true },
          });

          return this.bot.onReplyToMessage(replyMsg.chat.id, replyMsg.message_id, async (msg) => {
            const num = msg.text?.match(/\d+/g)?.at(0);
            const type = action === SET_MAX_GAS ? "maxGas" : "slippage";
            if (!msg.from?.id || !num) return;

            const text = await this.teleService.setConfig(type, msg.from.id, Number(num));
            this.bot.sendMessage(replyMsg.chat.id, text);
          });
        }

        // MARK: list token for change input's swap
        case CHANGE_INPUT_CURRENCY: {
          if (!query.message) return;
          this.bot.deleteMessage(chatId, query.message.message_id);
          const { text, buttons } = await this.teleService.listOptionsOfToken();
          return this.bot.sendMessage(chatId, text, buttons);
        }

        // MARK: custom input token
        case CHANGE_INPUT_TOKEN_CUSTOM: {
          const sent = await this.bot.sendMessage(chatId, "✏️  Enter token address", {
            reply_markup: { force_reply: true },
          });

          return this.bot.onReplyToMessage(chatId, sent.message_id, async (msg) => {
            if (!msg.from?.id || !msg?.text) return;
            if (!isAddress(msg.text)) {
              return this.bot.sendMessage(chatId, "Invalid token address");
            }
            const { text, buttons } = await this.teleService.changeSwapInputToken(userId, msg.text);
            return this.bot.sendMessage(chatId, text, buttons);
          });
        }

        // MARK: Import wallet
        case IMPORT_WALLET: {
          const replyMsg = await this.bot.sendMessage(
            chatId,
            "Imput your secret key or mnemonic here:",
            {
              reply_markup: { force_reply: true },
            },
          );

          return this.bot.onReplyToMessage(replyMsg.chat.id, replyMsg.message_id, async (msg) => {
            if (!msg.from?.id || !msg.text) return;
            this.bot.deleteMessage(chatId, replyMsg.message_id);
            this.bot.deleteMessage(chatId, msg.message_id);
            const text = await this.teleService.importWallet(msg.from.id, msg.text);
            this.bot.sendMessage(replyMsg.chat.id, text);
          });
        }

        // MARK: Create wallet
        case CREATE_WALLET: {
          const acc = await this.teleService.createWallet(query.from.id);
          return this.bot.sendMessage(
            chatId,
            `💠 Created successfully: \n ***\`${acc.address}\`*** \n\n 💠And please store your mnemonic phrase in safe place: \n ***\`${acc.mnemonic?.phrase}\`***`,
            {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              ...CLOSE_BUTTON,
            },
          );
        }

        // MARK: Add whale's wallet
        case WHALE_WALLET_ADD: {
          const sent1 = await this.bot.sendMessage(chatId, "Enter wallet address", {
            reply_markup: { force_reply: true },
          });

          return this.bot.onReplyToMessage(sent1.chat.id, sent1.message_id, async (msg) => {
            const address = msg.text;
            if (!address || !isAddress(address)) {
              return this.bot.sendMessage(chatId, "❌ It is not a wallet address");
            }

            const sent2 = await this.bot.sendMessage(sent1.chat.id, "Enter wallet name", {
              reply_markup: { force_reply: true },
            });

            this.bot.onReplyToMessage(sent2.chat.id, sent2.message_id, async (msg) => {
              if (!msg.text || !msg.from?.id) return;

              const text = await this.teleService.addWhaleWallet({
                channelId: chatId,
                userId: msg.from?.id,
                name: msg.text,
                address,
              });
              const sent2 = await this.bot.sendMessage(chatId, text);
              const { text: text2, buttons } = await this.teleService.whaleList(userId);

              this.bot.editMessageText(text2, {
                chat_id: sent2.chat.id,
                message_id: sent2.message_id,
                parse_mode: "Markdown",
                disable_web_page_preview: true,
                reply_markup: buttons,
              });
            });
          });
        }

        // MARK: List wallet
        case LIST_WALLET: {
          const btns = await this.teleService.listWallet(query.from.id);
          return this.bot.sendMessage(chatId, "Account List", btns);
        }

        case LIST_TRACK_WALLET: {
          const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
          const { text, buttons } = await this.teleService.whaleList(query.from.id);

          return this.bot.editMessageText(text, {
            chat_id: sent.chat.id,
            message_id: sent.message_id,
            reply_markup: buttons,
          });
        }

        // MARK: List tokens too same /tokens command
        case LIST_TOKEN: {
          if (query.message) {
            this.bot.deleteMessage(chatId, query.message.message_id);
          }
          const userId = msg.chat.id;
          const acc = await this.teleService.getAccount(userId);
          return this.bot.sendMessage(msg.chat.id, listTokensMsg(acc?.address), TOKENS_BUTTONS);
        }

        // MARK: remove message
        case CLOSE: {
          if (!query.message) return;
          return this.bot.deleteMessage(chatId, query.message.message_id);
        }

        case NO_CALLBACK:
          break;

        default:
          this.bot.sendMessage(chatId, "unknown command");
          break;
      }
    });
  }
}
