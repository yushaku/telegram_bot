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

  async setUser(id: number, value: string | Record<string, any>) {
    this.cache.set(id.toString(), JSON.stringify(value));
  }

  async getUser(id: number): Promise<UserEntity> {
    const user = await this.cache.get(id.toString());
    return JSON.parse(user ?? "{ }");
  }

  async setRoutes(id: string, route: SwapRoute) {
    this.cache.set(`route/${id}`, JSON.stringify(route), "PX", 60 * 1000);
  }

  async getRoute(id: string): Promise<SwapRoute | undefined> {
    const route = await this.cache.get(`route/${id}`);
    return JSON.parse(route ?? "{ }");
  }
}
