import TelegramBot, { User } from "node-telegram-bot-api";
import { ETHERSCAN_ID, INFURA_ID } from "../utils/constants";
import { walletDetail, walletMsg } from "../utils/replyMessage";
import {
  parseKey,
  createAccount,
  bigintToNumber,
  shortenAddress,
} from "../utils/utils";
import { UserEntity, Account } from "../utils/types";
import { RedisService } from "./redis.service";
import { UniswapService } from "./uniswap.service";
import { providers } from "ethers";

export class TeleService {
  private provider: providers.InfuraProvider;
  private etherscan: providers.EtherscanProvider;
  private cache: RedisService;
  private uniswap: UniswapService;

  constructor() {
    this.provider = new providers.InfuraProvider(1, INFURA_ID);
    this.etherscan = new providers.EtherscanProvider(1, ETHERSCAN_ID);
    this.uniswap = new UniswapService();
    this.cache = new RedisService();
  }

  async hi(userId: number) {
    const user = (await this.cache.get(userId)) as UserEntity;
    this.uniswap.checkBalance(user?.accounts[0].address);
  }

  async commandStart(user: User) {
    const { id, first_name, last_name } = user;
    const userInfo = await this.cache.get(id);
    if (userInfo) return userInfo;

    const defalt = {
      name: `${first_name} ${last_name}`,
      accounts: [],
      slippage: 10,
      maxGas: 10,
    };

    this.cache.set(id, defalt);
    return defalt;
  }

  async setConfig(type: "slippage" | "maxGas", userId: number, num: number) {
    const user = (await this.cache.get(userId)) as UserEntity;
    await this.cache.set(userId, {
      ...user,
      [type]: num,
    });

    return `Set ${type} to ${num} ${
      type === "slippage" ? "%" : "gwei"
    } successfully`;
  }

  async commandWallet(userId: number) {
    const user = (await this.cache.get(userId)) as UserEntity;
    const [accounts, block] = await Promise.all([
      this.getBalance(user.accounts),
      this.getBlock(),
    ]);

    return walletMsg({
      block: block?.block?.number ?? 0,
      ethPrice: block.ethPrice,
      accounts: accounts,
    });
  }

  async importWallet(userId: number, key: string) {
    const acc = parseKey(key);

    const user = (await this.cache.get(userId)) as UserEntity;
    const isExist = user.accounts.some((item) => item.address === acc.address);
    if (isExist) return "Wallet already exist";

    await this.cache.set(userId, {
      ...user,
      accounts: [
        ...user?.accounts,
        {
          address: acc.address,
          privateKey: acc.privateKey,
          mnemonic: null,
        },
      ],
    });
    return "Import successfully";
  }

  async createWallet(userId: number) {
    const acc = createAccount();
    const user = (await this.cache.get(userId)) as UserEntity;
    this.cache.set(userId, {
      ...user,
      accounts: [
        ...user?.accounts,
        {
          address: acc.address,
          mnemonic: acc.mnemonic?.phrase,
          privateKey: acc.privateKey,
        },
      ],
    });
    return acc;
  }

  async listWallet(userId: number): Promise<TelegramBot.SendMessageOptions> {
    const user = (await this.cache.get(userId)) as UserEntity;
    const accountList = user.accounts?.map((acc) => [
      {
        text: shortenAddress(acc.address, 8),
        callback_data: `detail ${acc.address}`,
      },
      { text: "❌ Delete", callback_data: `remove ${acc.address}` },
    ]);

    return {
      reply_markup: {
        inline_keyboard: accountList,
      },
    };
  }

  async deleteWallet(userId: number, address: string) {
    const user = (await this.cache.get(userId)) as UserEntity;
    console.log(user);

    const accounts = user.accounts.filter((acc) => acc.address !== address);
    await this.cache.set(userId, { ...user, accounts });
    return "Delete successfully";
  }

  async getDetails(wallet: string) {
    const [balance, block] = await Promise.all([
      this.provider.getBalance(wallet),
      this.getBlock(),
    ]);

    return walletDetail({
      block: block.block?.number ?? 0,
      ethPrice: block.ethPrice,
      balance: bigintToNumber(balance),
    });
  }

  async getBalance(accList: Account[]) {
    const balances = await Promise.all(
      accList.map((account) => this.provider.getBalance(account.address)),
    );

    return accList.map((account, index) => ({
      address: account.address,
      balance: bigintToNumber(balances[index]),
    }));
  }

  async getBlock() {
    const [block, ethPrice] = await Promise.all([
      this.etherscan.getBlock("latest"),
      this.etherscan.getEtherPrice(),
    ]);
    return { block, ethPrice };
  }
}
