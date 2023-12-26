import { RedisService } from "@/lib/RedisService";
import * as _ from "lodash";
import { WhaleModel } from "../entities/whale";
import { AnalysisHistory, AnalysisTrade } from "@/tracker/types";

type WhaleDto = {
  address: string;
  history: AnalysisHistory[];
  trade: AnalysisTrade[];
  currentBlock: Record<number, number>;
};

export class WhaleService {
  private cache = new RedisService();

  async find(address: string) {
    const whale = await WhaleModel.findById(address);
    return whale;
  }

  async update(data: WhaleDto) {
    await WhaleModel.findByIdAndUpdate(data.address, data);
  }

  async create(data: WhaleDto) {
    const result = await WhaleModel.create({
      _id: data.address,
      ...data,
    });
    console.log(result);
    return result;
  }

  async updateHistory(data: WhaleDto) {
    const whale = await this.find(data.address);
    if (_.isEmpty(whale)) {
      await this.create(data);
    } else {
      await this.update(data);
    }
  }
}
