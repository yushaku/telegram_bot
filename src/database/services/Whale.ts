import { RedisService } from "@/lib/RedisService";
import { WhaleModel } from "../entities/whale";
import { AnalysisTransaction } from "@/tracker/types";

export class WhaleService {
  private cache = new RedisService();

  async findByAdress(address: string) {
    const whale = await WhaleModel.findById(address);
    return whale;
  }
  async create(data: {
    address: string;
    history: AnalysisTransaction[];
    currentBlock: Record<number, number>;
  }) {
    const result = await WhaleModel.create({
      _id: data.address,
      ...data,
    });
    console.log(result);
    return result;
  }

  async updateHistory() {}
}
