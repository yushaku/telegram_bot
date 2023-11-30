import { RedisService } from "@/lib/RedisService";
import { getProvider, url, ws } from "@/utils/networks";
import { whaleActionMsg } from "@/utils/replyMessage";
import { REDIS_WHALE_WALLET } from "@/utils/replyTopic";
import { EventWhaleWallet, WhaleList } from "@/utils/types";
import TelegramBot from "node-telegram-bot-api";
import Web3, { FMT_BYTES, FMT_NUMBER, Log, utils } from "web3";
import { Erc20Token } from "@/lib/Erc20token";

const wsProvider = new Web3.providers.WebsocketProvider(ws);
const provider = getProvider();

export type ParseLog = {
  name: string;
  symbol: string;
  amount: number;
  from: string;
  to: string;
  address: string;
};

export class Tracker {
  private provider = new Web3(url);
  private socket = new Web3(wsProvider);
  private cache = new RedisService();
  private bot: TelegramBot;
  private wallets: Set<string> = new Set();
  private whale: WhaleList = {};

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.init();
    console.log(
      "Does the provider support subscriptions?:",
      wsProvider.supportsSubscriptions(),
    );
  }

  async init() {
    const whale = await this.cache.getWhaleWallets();
    this.wallets = new Set(Object.keys(whale));
    this.whale = whale;

    this.cache.redis.subscribe(REDIS_WHALE_WALLET, (err) => {
      if (err) console.log(err);
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

  async test() {
    // Get the list of accounts in the connected node which is in this case: Ganache.
    const accounts = await this.provider.eth.getAccounts();
    console.log(accounts);
    //
    // Send a transaction to the network
    const transactionReceipt = await this.provider.eth.sendTransaction({
      from: accounts[0],
      to: accounts[1],
      value: utils.toWei("0.001", "ether"),
    });
    console.log("Transaction Receipt:", transactionReceipt);
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
    console.log(log);

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
