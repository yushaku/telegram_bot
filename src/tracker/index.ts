import { RedisService } from '@/lib/RedisService';
import { url, ws } from '@/utils/networks';
import { whaleActionMsg } from '@/utils/replyMessage';
import { REDIS_WHALE_WALLET } from '@/utils/replyTopic';
import { EventWhaleWallet, WhaleList } from '@/utils/types';
import TelegramBot from 'node-telegram-bot-api';
import Web3 from 'web3';

const wsProvider = new Web3.providers.WebsocketProvider(ws);

export class Tracker {
  private provider = new Web3(url);
  private socket = new Web3(wsProvider);

  private cache = new RedisService();
  private bot: TelegramBot;
  private wallets: Set<string> = new Set();
  private whale: WhaleList = {};

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.initialization();
    const mess =
      wsProvider.supportsSubscriptions() === true
        ? '✅ Provider support subscription 🌐'
        : "⭕ Provider doesn't support subscription";
    console.info(mess);
  }

  async initialization() {
    const whale = await this.cache.getWhaleWallets();
    this.wallets = new Set(Object.keys(whale));
    this.whale = whale;

    this.cache.redis.subscribe(REDIS_WHALE_WALLET, (err) => {
      if (err) console.error(err);
    });

    this.cache.redis.on('message', (channel, message) => {
      if (channel !== REDIS_WHALE_WALLET) return;
      const data = JSON.parse(message) as EventWhaleWallet;
      const { channelId, wallet, type } = data;

      switch (type) {
        case 'add':
          let whale = this.whale[wallet];
          if (!whale?.subscribe) {
            whale = { subscribe: {} };
          }
          whale.subscribe[channelId] = channelId;
          this.wallets.add(wallet);
          break;

        case 'remove':
          delete this.whale[wallet].subscribe[channelId];
          const check = Object.keys(this.whale[wallet].subscribe).length === 0;
          if (check) this.wallets.delete(wallet);
          break;
      }
    });
  }

  async trackWhaleWallet() {
    try {
      const subscription = await this.socket.eth.subscribe('pendingTransactions', {
        address: Array.from(this.wallets),
      });

      subscription.on('data', async (data) => {
        console.log('new transaction: ', data);
        await new Promise((resolve) => setTimeout(resolve, 1_000));

        const tx = await this.provider.eth.getTransaction(data);

        if (tx) {
          const text = whaleActionMsg(tx);
          const whale = this.whale[tx.from];
          const list = Object.keys(whale?.subscribe ?? {});
          list.forEach((chatId) => {
            this.bot.sendMessage(chatId, text, {
              parse_mode: 'Markdown',
            });
          });
        }
        // await subscription.unsubscribe();
      });

      subscription.on('error', (error) => console.log('Error when tracking whale wallet: ', error));
    } catch (error) {
      console.error(error);
    }
  }
}
