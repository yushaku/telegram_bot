import { RedisService } from "@/lib/RedisService";
import { getProvider, url, ws } from "@/utils/networks";
import { whaleActionMsg } from "@/utils/replyMessage";
import { REDIS_WHALE_WALLET } from "@/utils/replyTopic";
import { EventWhaleWallet, WhaleList } from "@/utils/types";
import TelegramBot from "node-telegram-bot-api";
import Web3, { FMT_BYTES, FMT_NUMBER, Log } from "web3";
import { Erc20Token } from "@/lib/Erc20token";
import { DexMap, hashOfTransferTx } from "@/utils/constants";
import { ParseLog, Transaction } from "./types";
import { CoinMarket } from "@/market";
import { stableCoinList } from "@/utils/stableCoin";

const wsProvider = new Web3.providers.WebsocketProvider(ws);
const provider = getProvider();

export class Tracker {
  private provider = new Web3(url);
  private socket = new Web3(wsProvider);
  private market = new CoinMarket();

  private cache = new RedisService();
  private bot: TelegramBot;
  private wallets: Set<string> = new Set();
  private whale: WhaleList = {};

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.init();
    const mess =
      wsProvider.supportsSubscriptions() === true
        ? "✅ Provider support subscription 🌐"
        : "⭕ Provider doesn't support subscription";
    console.info(mess);
  }

  async init() {
    const whale = await this.cache.getWhaleWallets();
    this.wallets = new Set(Object.keys(whale));
    this.whale = whale;

    this.cache.redis.subscribe(REDIS_WHALE_WALLET, (err) => {
      if (err) console.error(err);
    });

    this.cache.redis.on("message", (channel, message) => {
      if (channel !== REDIS_WHALE_WALLET) return;
      const data = JSON.parse(message) as EventWhaleWallet;
      const { channelId, wallet, type } = data;

      switch (type) {
        case "add":
          this.whale[wallet].subscribe[channelId] = channelId;
          this.wallets.add(wallet);
          break;

        case "remove":
          delete this.whale[wallet].subscribe[channelId];
          const check = Object.keys(this.whale[wallet].subscribe).length === 0;
          if (check) this.wallets.delete(wallet);
          break;
      }
    });
  }

  async track() {
    try {
      const subscription = await this.socket.eth.subscribe(
        "pendingTransactions",
        {
          address: Array.from(this.wallets),
        },
      );

      subscription.on("data", async (data) => {
        console.log("new transaction: ", data);
        await new Promise((resolve) => setTimeout(resolve, 1_000));

        const tx = await this.provider.eth.getTransaction(data);

        if (tx) {
          const text = whaleActionMsg(tx);
          const whale = this.whale[tx.from];
          const list = Object.keys(whale?.subscribe ?? {});
          list.forEach((chatId) => {
            this.bot.sendMessage(chatId, text, {
              parse_mode: "Markdown",
            });
          });
        }

        // await subscription.unsubscribe();
      });

      subscription.on("error", (error) =>
        console.log("Error when tracking whale wallet: ", error),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async accountHisory(address: string) {
    const data = await this.market.getWalletHistory(address);
    if (!data) return;

    const list: Array<Transaction> = [];

    for (let i = 0; i < data.result.length; i++) {
      const tx = data.result[i];
      const userAdd = tx.from;
      const blockNumber = tx.blockNumber;
      const timestamp = tx.timeStamp;

      if (!DexMap.has(tx.to.toLocaleLowerCase())) continue;
      const receive = await this.getDetailTX(tx.hash);
      for (let i = 0; i < receive.length; i++) {
        const log = receive[i];
        if (!log || stableCoinList.has(log.address)) return;

        const res = await this.market.tokenPrice({
          tokenAddr: log.address,
          blockNumber,
        });

        const amount = Number(log.amount.toFixed(2));
        const price = Number(res.usdPrice.toFixed(2));
        const transaction = {
          hash: tx.hash,
          address: log.address,
          symbol: log.symbol,
          amount,
          price,
          total: amount * price,
          time: new Date(`${timestamp}000`),
          action: log.to === userAdd ? "BUY" : "SELL",
        };
        list.push(transaction);
      }
    }
  }

  async getDetailTX(hash: string) {
    const detail = await this.provider.eth.getTransactionReceipt(hash);
    const userAdd = detail.from;

    const promiseTransfers = detail.logs
      .filter((log) => {
        const hashFunc = log.topics?.at(0);
        const log1 = log.topics?.at(1)?.toString();
        const log2 = log.topics?.at(2)?.toString();

        const from = "0x" + log1?.slice(26);
        const to = "0x" + log2?.slice(26);

        if (
          hashFunc === hashOfTransferTx &&
          (from === userAdd || to === userAdd)
        ) {
          return true;
        }
      })
      .map((log) => this.convertLog(log));

    return Promise.all(promiseTransfers);
  }

  async getTx(hash: string) {
    const tx = await this.provider.eth.getTransactionReceipt(hash);

    const send = tx.logs.at(1);
    const receive = tx.logs.at(0);

    if (!send || !receive) return;

    const [sendTx, receiveTx] = await Promise.all([
      this.convertLog(send),
      this.convertLog(receive),
    ]);

    return {
      hash: tx.transactionHash.toString(),
      sendTx,
      receiveTx,
    };
  }

  async convertLog(log: Log): Promise<ParseLog | undefined> {
    const from = log.topics?.at(1)?.toString();
    const to = log.topics?.at(2)?.toString();

    if (!log?.address || !from || !to) return;
    const token = new Erc20Token(log.address, provider);
    const name = await token.name();
    const symbol = await token.symbol();
    console.log(name);

    const amount = Number(log.data) / 10 ** token.decimals;

    return {
      name,
      symbol,
      amount,
      address: log.address,
      from: "0x" + from.slice(26),
      to: "0x" + to.slice(26),
    };
  }

  async getPassTx() {
    this.provider.eth
      .getPastLogs(
        {
          address: "0x4abfcf64bb323cc8b65e2e69f2221b14943c6ee1",
        },
        { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX },
      )
      .then((res) => {
        console.log("ok", res);

        res.forEach((rec: any) => {
          console.log(rec?.blockNumber, rec?.transactionHash);
        });
      })
      .catch((err) => console.log("getPastLogs failed", err));
  }
}
