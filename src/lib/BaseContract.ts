import { SingletonProvider } from '@/utils/networks';
import { BigNumber, Contract, ContractInterface } from 'ethers';
import { formatEther, parseUnits } from 'ethers/lib/utils';

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
      return Number.parseFloat(formatEther(bigNumber));
    }
  }

  toEther(bigNumber: BigNumber) {
    return Number.parseFloat(formatEther(bigNumber));
  }

  toWei(amount: number) {
    return parseUnits(amount.toString());
  }
}
