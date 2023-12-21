import WTOKEN_ABI from "abis/weth.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { formatUnits, parseEther } from "ethers/lib/utils";
import { BaseContract } from "./BaseContract";

export class WrapToken extends BaseContract {
  public address: string;
  public decimals: number;

  constructor(address: string, decimals = 0) {
    super(address, WTOKEN_ABI);
    this.address = address;
    this.decimals = decimals;
  }

  async name() {
    return this.contract.name();
  }

  async symbol() {
    return this.contract.symbol();
  }

  async getInfo(address: string) {
    const [balance, decimals, name, symbol] = await Promise.all([
      this.balanceOf(address),
      this.getDecimals(),
      this.name(),
      this.symbol(),
    ]);

    return { balance, decimals, name, symbol };
  }

  async getDecimals() {
    if (!this.decimals) {
      const decimals = await this.contract.decimals();
      this.decimals = decimals;
    }
    return this.decimals;
  }

  async balanceOf(address: string): Promise<number> {
    return this.contract
      .balanceOf(address)
      .then((data: BigNumber) => this.toNumber(data))
      .then((data: string) => Number(data))
      .catch((err: any) => console.log(err));
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
      const tx = await contract.approve(to, this.toWei(amount));
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async allowance(account: string, spender: string) {
    return this.contract
      .allowance(account, spender)
      .then((data: BigNumber) => this.toNumber(data))
      .then((data: string) => Number(data))
      .catch((err: any) => console.log(err));
  }

  async estimateGas(fn: "deposit" | "withdraw" | "transfer", amount: number) {
    switch (fn) {
      case "transfer":
        break;
      case "withdraw":
        return await this.contract.estimateGas
          .withdraw(this.toWei(amount))
          .then((data: BigNumber) => formatUnits(data, "gwei"));
      case "deposit":
        return await this.contract.estimateGas
          .deposit({ value: this.toWei(amount) })
          .then((data: BigNumber) => formatUnits(data, "gwei"));
    }
  }

  async wrap(amount: number, privateKey: string) {
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);
    try {
      return contract.deposit({ value: parseEther(String(amount)) });
    } catch (error) {
      throw error;
    }
  }

  async unwrap(amount: number, privateKey: string) {
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, WTOKEN_ABI, signer);

    try {
      return contract.withdraw(this.toWei(amount));
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
      const tx = await contract.transfer(to, this.toWei(amount));
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}
