import { User } from "node-telegram-bot-api";
import { RedisService } from "./redis.service";
import { InfuraProvider } from "ethers";
import { INFURA_ID } from "../utils/constants";
import { walletMsg } from "../utils/replyMessage";
import { UserEntity } from "../type";
import { createAccount, parseKey } from "../utils/ether";

export class TeleService {
  private provider: InfuraProvider;
  private cache: RedisService;

  constructor() {
    this.provider = new InfuraProvider(1, INFURA_ID);
    this.cache = new RedisService();
  }

  async commandStart(user: User) {
    const { id, first_name, last_name } = user;
    this.cache.set(id, {
      name: `${first_name} ${last_name}`,
      account: [],
      slippage: 10,
      maxGas: 10,
    });
  }

  async commandWallet(userId: number) {
    const user = (await this.cache.get(userId)) as UserEntity;
    return walletMsg({
      gas: 25,
      block: 123123,
      ethCost: 1232,
      accounts: user?.accounts,
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

  async getEth() {
    this.provider.getFeeData();
    return this.provider.getBalance(
      "0xa4C11bD5B6F1f76729E02d47592f2E70E80dbA0c",
    );
  }
}
