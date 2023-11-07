import { EtherscanProvider, InfuraProvider } from "ethers";
import TelegramBot, { InlineKeyboardButton, User } from "node-telegram-bot-api";
import { Account, UserEntity } from "../type";
import { ETHERSCAN_ID, INFURA_ID } from "../utils/constants";
import { bigintToNumber, createAccount, parseKey } from "../utils/ether";
import { walletMsg } from "../utils/replyMessage";
import { RedisService } from "./redis.service";

export class TeleService {
  private provider: InfuraProvider;
  private etherscan: EtherscanProvider;
  private cache: RedisService;

  constructor() {
    this.provider = new InfuraProvider(1, INFURA_ID);
    this.etherscan = new EtherscanProvider(1, ETHERSCAN_ID);
    this.cache = new RedisService();
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
      { text: acc.address, callback_data: `detail ${acc.address}` },
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

  async getBalance(accList: Account[]) {
    const query = accList.map((account) =>
      this.provider.getBalance(account.address),
    );

    const balances = await Promise.all([
      this.etherscan.getEtherPrice(),
      ...query,
    ]);

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
