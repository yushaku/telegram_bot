import { toReadableAmount } from "@/utils/utils";
import { JsonRpcProvider } from "@ethersproject/providers";
import ABIs from "abis/ChainLinkDataFeed.json";
import { Contract } from "ethers";

const aggregatorAddress = {
  BTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
  ADA: "0xAE48c91dF1fE419994FFDa27da09D5aC69c30f55",
  AAVE: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9",
  BNB: "0x14e613AC84a31f709eadbdF89C6CC390fDc9540A",
  IMX: "0xBAEbEFc1D023c0feCcc047Bff42E75F15Ff213E6",
  LINK: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
  SOL: "0x4ffC43a60e009B551865A93d232E33Fce9f01507",
};

export class DataFeed {
  protected contract: Contract;
  protected decimals = 8;

  constructor(
    provider: JsonRpcProvider,
    token: keyof typeof aggregatorAddress,
  ) {
    const add = aggregatorAddress[token];
    this.contract = new Contract(add, ABIs, provider);
  }

  async getRoundData(roundId?: number) {
    let data: any;
    roundId
      ? (data = await this.contract.getRoundData(roundId))
      : (data = await this.contract.latestRoundData());

    console.log(data);
  }

  async getPrice(roundId?: number) {
    let price: number;

    roundId
      ? (price = await this.contract.getAnswer(roundId))
      : (price = await this.contract.latestAnswer());

    return toReadableAmount(price, this.decimals);
  }

  async latestTimestamp() {
    const res = await this.contract.latestTimestamp();
    console.log(res);
  }

  async latestRound() {
    const res = await this.contract.latestRound();
    return toReadableAmount(res, this.decimals);
  }

  async toReadable(data: number) {
    return toReadableAmount(data, 0);
  }

  async getRoundid() {
    const timestamp = "1698051611";
    const latestRound = await this.contract.latestRound().then(this.toReadable);
    const time = await this.contract.latestTimestamp().then(this.toReadable);

    const diff = Number(time) - Number(timestamp);
    const maybe = BigInt(latestRound) - BigInt(diff);

    console.log({
      latestRound,
      timestamp,
      time,
      diff,
      maybe,
    });

    const price = await this.getPrice(Number(maybe));
    console.log(toReadableAmount(Number(price), 0));
  }
}
