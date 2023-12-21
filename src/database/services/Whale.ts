import { RedisService } from "@/lib/RedisService";
import { WhaleModel } from "../entities/whale";

export class WhaleService {
  private cache = new RedisService();

  async findByAdress(address: string) {
    const whale = await WhaleModel.findById(address);
    return whale;
  }
  async create(data: { address: string }) {
    const result = await WhaleModel.create(data);
    console.log(result);
    return result;
  }

  async updateHistory() {}
}
