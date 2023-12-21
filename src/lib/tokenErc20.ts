import { JsonRpcProvider } from "@ethersproject/providers";
import ERC20_ABI from "abis/erc20.json";
import { Token } from "@uniswap/sdk-core";
import { Contract, Wallet } from "ethers";
import { TransactionState } from "uniswap/types";
import { Account } from "utils/types";
import { fromReadableToAmount, toReadableAmount } from "utils/utils";

export async function checkTokenApproval({
  token,
  amount,
  account,
  contractAddress,
  provider,
}: {
  token: Token;
  amount: number;
  account: Account;
  contractAddress: string;
  provider: JsonRpcProvider;
}) {
  try {
    const signer = new Wallet(account.privateKey, provider);
    const contract = new Contract(token.address, ERC20_ABI, signer);

    const allowedAmount = await contract.allowance(
      account.address,
      contractAddress,
    );

    console.log(`Allowed amount: ${toReadableAmount(allowedAmount)}`);
    if (allowedAmount >= amount) return "Ok";

    const hexAmount = fromReadableToAmount(amount, token.decimals).toString();
    const transaction = await contract.approve(contractAddress, hexAmount);

    const result = await transaction.wait();
    console.log("transaction: " + result?.transactionHash);
    return result?.transactionHash;
  } catch (error) {
    console.error(error);
    return TransactionState.Failed;
  }
}

export async function balanceOf({
  token,
  account,
  provider,
}: {
  token: Token;
  account: Account;
  provider: JsonRpcProvider;
}) {
  const tokenContract = new Contract(token.address, ERC20_ABI, provider);
  const allowedAmount = await tokenContract.balanceOf(account.address);
  return allowedAmount;
}

export async function approve({
  token,
  account,
  amount,
  contractAddress,
  provider,
}: {
  token: Token;
  account: Account;
  amount: number;
  contractAddress: string;
  provider: JsonRpcProvider;
}) {
  try {
    const signer = new Wallet(account.privateKey, provider);
    const tokenContract = new Contract(token.address, ERC20_ABI, signer);
    const hexAmount = fromReadableToAmount(amount, token.decimals).toString();

    const transaction = await tokenContract.approve(contractAddress, hexAmount);
    const result = await transaction.wait();
    return result?.transactionHash;
  } catch (error) {
    console.error(error);
    return TransactionState.Failed;
  }
}

export async function allowance({
  token,
  account,
  contractAddress,
  provider,
}: {
  token: Token;
  account: Account;
  contractAddress: string;
  provider: JsonRpcProvider;
}) {
  const tokenContract = new Contract(token.address, ERC20_ABI, provider);
  const allowedAmount = await tokenContract.allowance(
    account.address,
    contractAddress,
  );
  return allowedAmount;
}

export async function getTokenInfo({
  tokenAddress,
  walletAddress,
  provider,
}: {
  tokenAddress: string;
  walletAddress?: string;
  provider: JsonRpcProvider;
}) {
  const contractERC20 = new Contract(tokenAddress, ERC20_ABI, provider);

  const [balance, decimals, name, symbol] = await Promise.all([
    contractERC20.balanceOf(walletAddress),
    contractERC20.decimals(),
    contractERC20.name(),
    contractERC20.symbol(),
  ]);

  return {
    balance: toReadableAmount(balance, decimals),
    decimals,
    name,
    symbol,
  };
}
