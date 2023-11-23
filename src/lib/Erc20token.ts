import { JsonRpcProvider } from "@ethersproject/providers";
import ERC20 from "abis/erc20.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { TransactionState } from "uniswap/types";
import { Account } from "utils/types";
import { fromReadableAmount, toReadableAmount } from "utils/utils";

export class Erc20Token {
  public name: string;
  public address: string;
  public decimals: number;
  private contract: Contract;
  private provider: JsonRpcProvider;

  constructor(
    address: string,
    name = "ERC20",
    decimals = 18,
    provider: JsonRpcProvider,
  ) {
    this.name = name;
    this.address = address;
    this.decimals = decimals;
    this.provider = provider;
    this.contract = new Contract(address, ERC20, provider);
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
    const contract = new Contract(this.address, ERC20, signer);

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

  async balanceOf({ address }: { address: string }) {
    return this.contract.balanceOf(address);
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

      console.log(`Allowed amount: ${toReadableAmount(allowedAmount)}`);
      if (allowedAmount >= amount) return "Ok";

      const transaction = await this.approve({
        amount,
        privateKey: account.privateKey,
        to: spender,
      });

      const result = await transaction.wait();
      console.log("transaction: " + result?.transactionHash);
      return result?.transactionHash;
    } catch (error) {
      console.error(error);
      return TransactionState.Failed;
    }
  }
}
