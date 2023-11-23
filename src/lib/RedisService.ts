import { SwapRoute } from "@uniswap/smart-order-router";
import Redis from "ioredis";
import { UserEntity } from "../utils/types";

export class RedisService {
  private readonly cache: Redis;
  constructor() {
    this.cache = new Redis({
      port: 6379,
      host: "127.0.0.1",
    });
  }

  async setUser(id: number, value: UserEntity) {
    this.cache.set(id.toString(), JSON.stringify(value));
  }

  async getUser(id: number): Promise<UserEntity> {
    const user = await this.cache.get(id.toString());
    return JSON.parse(user ?? "{ }");
  }

  async setOrder(id: string, order: Order): Promise<void>;
  async setOrder(id: string, order: SwapRoute): Promise<void>;

  async setOrder(id: string, order: Order | SwapRoute) {
    this.cache.set(`order/${id}`, JSON.stringify(order), "PX", 60 * 1000);
  }

  async getOrder(id: string): Promise<Order | SwapRoute | undefined> {
    const route = await this.cache.get(`order/${id}`);
    return JSON.parse(route ?? "{ }");
  }
}

type Order = { tokenAddress: string; amount: number };

export function isOrder(tx: Order | any): tx is Order {
  return (tx as Order).amount !== undefined;
}

export function isSwapRoute(tx: SwapRoute | any): tx is SwapRoute {
  return (tx as SwapRoute).route !== undefined;
}
