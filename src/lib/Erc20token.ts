import ERC20 from "abis/erc20.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { TransactionState } from "uniswap/types";
import { Account } from "utils/types";
import { BaseContract } from "./BaseContract";

export class Erc20Token extends BaseContract {
  public address: string;
  public decimals: number;

  constructor(address: string, decimals = 0) {
    super(address, ERC20);
    this.address = address;
    this.decimals = decimals;
  }

  async getInfo(address: string) {
    const [balance, decimals, name, symbol] = await Promise.all([
      this.balanceOf(address),
      this.getDecimals(),
      this.name(),
      this.symbol(),
    ]);

    return { balance, decimals, name, symbol, address };
  }

  async name() {
    return this.contract.name();
  }

  async symbol() {
    return this.contract.symbol();
  }

  async getDecimals() {
    if (this.decimals === 0) {
      const decimals = await this.contract.decimals();
      this.decimals = decimals;
    }
    return this.decimals;
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
    const signer = new Wallet(privateKey, this.provider);
    const contract = new Contract(this.address, ERC20, signer);

    try {
      const tx = await contract.approve(to, this.toWei(amount));
      const result = await tx.wait();
      console.log(`Allowed ${amount} to ${to} `);
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

  async balanceOf(address: string): Promise<number> {
    return this.contract
      .balanceOf(address)
      .then((data: BigNumber) => this.toNumber(data))
      .then((data: string) => Number(data))
      .catch((err: any) => console.log(err));
  }

  async estimateGas(
    fn: "deposit" | "withdraw" | "transfer",
    amount: number,
    to?: string,
  ) {
    switch (fn) {
      case "transfer":
        return await this.contract.estimateGas
          .transfer(to, this.toWei(amount))
          .then((data: BigNumber) => formatUnits(data, "gwei"));
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
    const contract = new Contract(this.address, ERC20, signer);

    try {
      const tx = await contract.transfer(to, this.toWei(amount));
      const result = await tx.wait();
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async checkTokenApproval({
    amount,
    account,
    spender,
  }: {
    amount: number;
    account: Account;
    spender: string;
  }) {
    try {
      const allowedAmount = await this.allowance(account.address, spender);
      if (allowedAmount >= amount) return "Ok";
      return this.approve({
        amount,
        privateKey: account.privateKey,
        to: spender,
      });
    } catch (error) {
      console.error(error);
      return TransactionState.Failed;
    }
  }
}
