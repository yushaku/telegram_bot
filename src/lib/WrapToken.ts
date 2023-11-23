import WTOKEN_ABI from "abis/weth.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { formatUnits, parseEther } from "ethers/lib/utils";
import { getProvider } from "utils/networks";
import { fromReadableAmount, toReadableAmount } from "utils/utils";

export class WrapToken {
  public name: string;
  public address: string;
  public decimals: number;
  private contract: Contract;
  private provider = getProvider();

  constructor(address: string, name = "WToken", decimals = 18) {
    this.name = name;
    this.address = address;
    this.decimals = decimals;
    this.contract = new Contract(address, WTOKEN_ABI, this.provider);
  }

  async getInfo(address: string) {
    const [balance, decimals, name, symbol] = await Promise.all([
      this.contract.balanceOf(address),
      this.contract.decimals(),
      this.contract.name(),
      this.contract.symbol(),
    ]);

    return {
      balance: toReadableAmount(balance, decimals),
      decimals,
      name,
      symbol,
    };
  }

  async balanceOf({ address }: { address: string }) {
    return this.contract.balanceOf(address);
  }

  async approve({
    amount,
    to,
    privateKey,
  }: {
    amount: number;
    to: string;
    privateKey: string;
  }) {
    const signer = this.provider.getSigner(privateKey);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);

    try {
      const tx = await contract.approve(
        to,
        fromReadableAmount(amount, this.decimals),
      );
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async allowance(account: string, spender: string) {
    return this.contract.allowance(account, spender);
  }

  async estimateGas(fn: "deposit" | "withdraw" | "transfer", amount: number) {
    switch (fn) {
      case "transfer":
        break;
      case "withdraw":
        return await this.contract.estimateGas
          .withdraw(fromReadableAmount(amount, 18))
          .then((data: BigNumber) => formatUnits(data, "gwei"));
      case "deposit":
        return await this.contract.estimateGas
          .deposit({ value: fromReadableAmount(amount, 18) })
          .then((data: BigNumber) => formatUnits(data, "gwei"));
    }
  }

  async wrap(amount: number, privateKey: string) {
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);
    try {
      return contract.deposit({
        value: parseEther(String(amount)),
      });
    } catch (error) {
      throw error;
    }
  }

  async unwrap(amount: number, privateKey: string) {
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);

    try {
      const tx = await contract.withdraw(
        fromReadableAmount(amount, this.decimals),
      );
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async transfer({
    amount,
    to,
    privateKey,
  }: {
    amount: number;
    to: string;
    privateKey: string;
  }) {
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);

    try {
      const tx = await contract.transfer(
        to,
        fromReadableAmount(amount, this.decimals),
      );
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}
