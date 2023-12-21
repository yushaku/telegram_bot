import { RedisService } from "@/lib/RedisService";
import { User } from "node-telegram-bot-api";
import { UserModel } from "../entities/User";
import * as _ from "lodash";
import { chainId } from "@/utils/token";
import { WETH9 } from "@uniswap/sdk-core";
import { UserEntity } from "@/utils/types";
import { Erc20Token } from "@/lib/Erc20token";

export class userService {
  private cache = new RedisService();

  async create(user: User) {
    const { id, first_name, last_name } = user;
    const defalt = {
      _id: user.id,
      name: `${first_name} ${last_name}`,
      tokenIn: {
        address: WETH9[chainId].address,
        decimals: WETH9[chainId].decimals,
      },
      accounts: [],
      watchList: [],
      mainAccount: null,
      slippage: 10,
      maxGas: 10,
    };

    const newUser = new UserModel(defalt);
    await newUser.save();
    await this.cache.setUser(id, defalt);
    return newUser;
  }

  async findById(id: number) {
    const userInfo = await this.cache.getUser(id);
    if (!_.isEmpty(userInfo)) return userInfo;

    const user = (await UserModel.findById(id)) as UserEntity;

    if (user) {
      await this.cache.setUser(id, {
        ...user,
        tokenIn: {
          address: WETH9[chainId].address,
          decimals: WETH9[chainId].decimals,
        },
      });
    }
    return user;
  }

  async findOrCreate(user: User) {
    const userInfo = await this.findById(user.id);
    return !_.isEmpty(userInfo) ? userInfo : this.create(user);
  }

  async update(user: UserEntity & { userId: number }) {
    await this.cache.setUser(user.userId, user);
    const a = await UserModel.findByIdAndUpdate(user.userId, user);
    console.log(a);
  }

  async delete(user: User) {}

  async getAccount(userId: number) {
    const user = await this.findById(userId);
    const acc = user.mainAccount;
    if (acc) return acc;

    const firstAcc = user.accounts?.at(0);
    if (!firstAcc) return null;

    await this.update({
      userId,
      ...user,
      mainAccount: firstAcc,
    });

    return firstAcc;
  }
}
