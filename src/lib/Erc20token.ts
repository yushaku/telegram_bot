import { JsonRpcProvider } from "@ethersproject/providers";
import ERC20 from "abis/erc20.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { TransactionState } from "uniswap/types";
import { Account } from "utils/types";
import { fromReadableAmount, toReadableAmount } from "utils/utils";

export class Erc20Token {
  private provider: JsonRpcProvider;
  private contract: Contract;
  public address: string;
  public decimals: number;

  constructor(address: string, provider: JsonRpcProvider, decimals = 18) {
    this.address = address;
    this.provider = provider;
    this.contract = new Contract(address, ERC20, provider);
    this.decimals = decimals;
    this.checkDecimals();
  }

  async getInfo(address: string) {
    const [balance, decimals, name, symbol] = await Promise.all([
      this.contract.balanceOf(address),
      this.contract.decimals(),
      this.contract.name(),
      this.contract.symbol(),
    ]);

    return {
      balance: Number(toReadableAmount(balance, decimals)),
      decimals,
      name,
      symbol,
    };
  }

  async name() {
    return this.contract.name();
  }

  async symbol() {
    return this.contract.symbol();
  }

  async getDecimal() {
    return this.contract.decimals();
  }

  async checkDecimals() {
    const decimals = await this.getDecimal();
    this.decimals = decimals;
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
      const tx = await contract.approve(
        to,
        fromReadableAmount(amount, this.decimals),
      );
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
      .then((data: BigNumber) => toReadableAmount(data, this.decimals))
      .then((data: string) => Number(data))
      .catch((err: any) => console.log(err));
  }

  async balanceOf(address: string): Promise<number> {
    return this.contract
      .balanceOf(address)
      .then((data: BigNumber) => toReadableAmount(data, this.decimals))
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
          .transfer(to, fromReadableAmount(amount, 18))
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

      console.log(`Allowed amount: ${allowedAmount}`);
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
