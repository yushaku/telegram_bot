import { SingletonProvider } from "@/utils/networks";
import { BigNumber, Contract, ContractInterface, utils } from "ethers";

export class BaseContract {
  protected provider = SingletonProvider.getInstance();
  protected contract: Contract;

  constructor(address: string, abi: ContractInterface) {
    this.contract = new Contract(address, abi, this.provider);
  }

  toNumber(bigNumber: BigNumber) {
    try {
      return bigNumber.toNumber();
    } catch (er) {
      return Number.parseFloat(utils.formatEther(bigNumber));
    }
  }

  toEther(bigNumber: BigNumber) {
    return Number.parseFloat(utils.formatEther(bigNumber));
  }

  toWei(amount: number) {
    return utils.parseUnits(amount.toString());
  }
}
