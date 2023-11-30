import { TeleService } from "TeleService";
import { isAddress } from "ethers/lib/utils";
import TelegramBot from "node-telegram-bot-api";
import { TOKENS_BUTTONS, WALLET_BUTTONS } from "utils/replyButton";
import { reportMsg, whaleActionMsg2 } from "utils/replyMessage";
import {
  WATCH_WALLET_ADD,
  BUY_TOKEN,
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
} from "utils/replyTopic";
import { NODE_ENV, chainId } from "utils/token";
import { isTransaction } from "utils/types";
import { shortenAddress } from "utils/utils";
import { Tracker } from "./tracker";
import { CoinMarket } from "./market";

export class TeleBot {
  private readonly bot: TelegramBot;
  private teleService: TeleService;
  private tracker: Tracker;
  private market: CoinMarket;

  constructor(teleId: string) {
    this.bot = new TelegramBot(teleId, { polling: true });
    this.teleService = new TeleService();
    this.tracker = new Tracker(this.bot);
    this.market = new CoinMarket();
  }

  init() {
    console.info(`🤖 Telegram bot is running`);
    console.info(`🚀 Run on Chain: ${NODE_ENV} with chain id: ${chainId}`);
    this.tracker.track();
    this.bot.setMyCommands([
      {
        command: "/watch",
        description: "follows the shark and whale",
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
  }

  listen() {
    // this.bot.onText(/\/sniper/, (msg) => {
    //   if (!msg.from) return;
    //   this.teleService.commandStart(msg.from);
    //   this.bot.sendMessage(msg.chat.id, START_MESSAGE, START_BUTTONS);
    // });

    // MARK: /watch whale's wallet
    this.bot.onText(/\/watch/, async (msg) => {
      const id = msg.from?.id;
      if (!id) return;

      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const { text, buttons } = await this.teleService.watchList(id);

      this.bot.editMessageText(text, {
        chat_id: sent.chat.id,
        message_id: sent.message_id,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: buttons,
      });
    });

    this.bot.onText(/\/test/, async (msg) => {
      if (!msg.from) return;
      const sent = await this.bot.sendMessage(msg.chat.id, "Processing...");
      const data = await this.tracker.getTx(
        "0x6a07a78b6fa4617fdc1ef482b134a1bda0c2e229d12b82c24ffdf2a11ec6ed01",
      );
      if (!data) return;
      const { sendTx, receiveTx, hash } = data;
      this.bot.editMessageText(
        whaleActionMsg2({
          hash,
          sendTx,
          receiveTx,
        }),
        {
          message_id: sent.message_id,
          chat_id: sent.chat.id,
          parse_mode: "Markdown",
        },
      );
    });

    this.bot.onText(/\/trade/, async (msg) => {
      if (!msg.from) return;
      const sent = await this.bot.sendMessage(
        msg.chat.id,
        "Swap from WETH to UNI",
      );
      this.bot.editMessageText("hello", {
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

    // MARK: /tokens command
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

    // MARK: /wallets command
    this.bot.onText(/\/start/, async (msg) => {
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

    // MARK: /address of smartcontract
    this.bot.onText(/^(0x)?[0-9a-fA-F]{40}$/, async (msg) => {
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
      if (
        action.match(/(remove_wallet|detail_wallet|change_input_token) (\S+)/g)
      ) {
        console.log(action);

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

            this.bot.editMessageText(text, {
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...buttons,
            });
            break;
          }

          // MARK: remove user's wallet
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

          // MARK: change input of swap
          case "change_input_token": {
            if (!query.message) return;
            this.bot.deleteMessage(chatId, query.message.message_id);
            const { text, buttons } =
              await this.teleService.changeSwapInputToken(userId, address);
            return this.bot.sendMessage(chatId, text, buttons);
          }
        }
      }

      //HACK: 🐳 CRUD TRACK WALLET
      if (action.match(/(watch_wallet_remove|watch_wallet) (\S+)/g)) {
        const [type, address] = action.split(" ");
        switch (type) {
          // MARK: remove wallet in watching list
          case "watch_wallet_remove": {
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
                const text = await this.teleService.removeWatchWallet({
                  userId: msg.from.id,
                  address,
                  channelId: chatId,
                });
                return this.bot.sendMessage(chatId, text);
              },
            );
          }

          // MARK: get details of tracked wallet
          case "watch_wallet": {
            const { text, buttons } =
              await this.teleService.detailWallet(address);

            return this.bot.sendMessage(chatId, text, {
              parse_mode: "Markdown",
              disable_web_page_preview: false,
              reply_markup: buttons,
            });
          }
        }
      }

      //HACK: 🪙 BUY/SELL TOKEN
      if (
        action.match(/(buy_custom|confirm_swap|sell_custom|top_holders) (\S+)/g)
      ) {
        const [type, address] = action.split(" ");

        switch (type) {
          // MARK: buy amount of token
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
              },
            );
          }

          // MARK: confirm swap
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

            console.log(result);
            if (!isTransaction(result)) return;

            const sent2 = await this.bot.editMessageText(
              reportMsg({ status: "Pending", hash: result.hash }),
              {
                chat_id: sent.chat.id,
                message_id: sent.message_id,
              },
            );

            if (typeof sent2 === "boolean") return;
            const received = await result.wait();
            return this.bot.editMessageText(
              reportMsg({
                status: received.status === 1 ? "Success" : "Failed",
                hash: received.transactionHash,
                gas: received.gasUsed,
              }),
              {
                parse_mode: "Markdown",
                chat_id: sent2.chat.id,
                message_id: sent2.message_id,
              },
            );
          }

          //MARK: get top holders of token
          case "top_holders": {
            const sent = await this.bot.sendMessage(
              chatId,
              "Getting top holders...",
            );

            const { text, buttons } =
              await this.teleService.getTopHolders(address);
            return this.bot.editMessageText(text, {
              parse_mode: "Markdown",
              chat_id: sent.chat.id,
              message_id: sent.message_id,
              ...buttons,
            });
          }

          // TODO: Sell amount of token
          case "sell_custom": {
            const { symbol } = await this.teleService.getDefaultToken(userId);
            const sent = await this.bot.sendMessage(
              chatId,
              `💎 Sell this token to receive ${symbol}\n✏️  Enter a custom sell amount.\nAmount  Greater or equal to 0.01`,
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
                    "Swap token...",
                  );

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
              },
            );
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

        // TODO: Swap now
        case "swap_now": {
          break;
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

        // MARK: remove message
        case CLOSE: {
          if (!query.message) return;
          return this.bot.deleteMessage(chatId, query.message.message_id);
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
          const sent = await this.bot.sendMessage(
            chatId,
            "✏️  Enter token address",
            { reply_markup: { force_reply: true } },
          );

          return this.bot.onReplyToMessage(
            chatId,
            sent.message_id,
            async (msg) => {
              if (!msg.from?.id || !msg?.text) return;
              if (!isAddress(msg.text)) {
                return this.bot.sendMessage(chatId, "Invalid token address");
              }
              const { text, buttons } =
                await this.teleService.changeSwapInputToken(userId, msg.text);
              return this.bot.sendMessage(chatId, text, buttons);
            },
          );
        }

        // MARK: Import wallet
        case IMPORT_WALLET: {
          const replyMsg = await this.bot.sendMessage(
            chatId,
            "Imput your secret key or mnemonic here:",
            { reply_markup: { force_reply: true } },
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

        // MARK: Create wallet
        case CREATE_WALLET: {
          const acc = await this.teleService.createWallet(query.from.id);
          return this.bot.sendMessage(
            chatId,
            `💠 Created successfully: \n ***${acc.address}*** \n\n 💠And please store your mnemonic phrase in safe place: \n ***${acc.mnemonic?.phrase}***`,
            { parse_mode: "Markdown", disable_web_page_preview: true },
          );
        }

        // MARK: Add wallet to watching list
        case WATCH_WALLET_ADD: {
          const sent1 = await this.bot.sendMessage(
            chatId,
            "Enter wallet address",
            { reply_markup: { force_reply: true } },
          );

          return this.bot.onReplyToMessage(
            sent1.chat.id,
            sent1.message_id,
            async (msg) => {
              const address = msg.text;
              if (!address || !isAddress(address)) {
                return this.bot.sendMessage(
                  chatId,
                  "❌ It is not a wallet address",
                );
              }

              const sent2 = await this.bot.sendMessage(
                sent1.chat.id,
                "Enter wallet name",
                { reply_markup: { force_reply: true } },
              );

              this.bot.onReplyToMessage(
                sent2.chat.id,
                sent2.message_id,
                async (msg) => {
                  if (!msg.text || !msg.from?.id) return;

                  const text = await this.teleService.addWatchWallet({
                    channelId: chatId,
                    userId: msg.from?.id,
                    name: msg.text,
                    address,
                  });
                  this.bot.sendMessage(chatId, text);
                },
              );
            },
          );
        }

        // MARK: List wallet
        case LIST_WALLET: {
          const btns = await this.teleService.listWallet(query.from.id);
          return this.bot.sendMessage(chatId, "Account List", btns);
        }

        // MARK: List tokens too same /tokens command
        case BUY_TOKEN: {
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
