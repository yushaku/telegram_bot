import Redis from "ioredis";

export class RedisService {
  private readonly cache: Redis;
  constructor() {
    this.cache = new Redis({
      port: 6379,
      host: "127.0.0.1",
    });
  }

  async set(id: number, value: string | Record<string, any>) {
    this.cache.set(id.toString(), JSON.stringify(value));
  }

  async get(id: number) {
    const user = await this.cache.get(id.toString());
    return JSON.parse(user ?? "{ }");
  }
}
