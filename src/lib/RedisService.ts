import { SwapRoute } from "@uniswap/smart-order-router";
import Redis from "ioredis";
import { UserEntity, WhaleList } from "../utils/types";
import { EstimateTrade } from "@/uniswap/swap/type";

export class RedisService {
  readonly redis: Redis;
  constructor() {
    this.redis = new Redis({
      port: 6379,
      host: "127.0.0.1",
    });
  }

  async setUser(id: number, value: UserEntity) {
    this.redis.set(id.toString(), JSON.stringify(value));
  }

  async getUser(id: number): Promise<UserEntity> {
    const user = await this.redis.get(id.toString());
    return JSON.parse(user ?? "{ }");
  }

  async setOrder(id: string, order: Order): Promise<void>;
  async setOrder(id: string, order: SwapRoute): Promise<void>;

  async setOrder(id: string, order: Order | SwapRoute) {
    this.redis.set(`order/${id}`, JSON.stringify(order), "PX", 60 * 1000);
  }

  async getOrder(
    id: string,
  ): Promise<Order | SwapRoute | EstimateTrade | undefined> {
    const route = await this.redis.get(`order/${id}`);
    return JSON.parse(route ?? "{ }");
  }

  async getWhaleWallets(): Promise<WhaleList> {
    const res = await this.redis.get("whaleList");
    return JSON.parse(res ?? "{  }");
  }

  async setWhaleWallets(data: WhaleList) {
    this.redis.set("whaleList", JSON.stringify(data));
  }
}

type Order = {
  tokenAddress: string;
  amount: number;
  type: "BUY" | "SELL";
};

export function isOrder(tx: Order | any): tx is Order {
  return (tx as Order).amount !== undefined;
}

export function isSwapRoute(tx: SwapRoute | any): tx is SwapRoute {
  return (tx as SwapRoute).route !== undefined;
}

export function isTrade(tx: EstimateTrade | any): tx is EstimateTrade {
  return (tx as EstimateTrade).swaps !== undefined;
}
