import { EtherscanProvider } from "@ethersproject/providers";
import { Wallet } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { ETHERSCAN_ID } from "utils/constants";
import { getProvider } from "utils/networks";
import { chainId } from "utils/token";
import { Account } from "utils/types";
import { Transaction } from "web3";

// const web3 = getWeb3Provider();
const provider = getProvider();
const etherscan = new EtherscanProvider(chainId, ETHERSCAN_ID);

// const txObject = {
//   from: "0xYourAddress",
//   to: "0xRecipientAddress",
//   value: utils.toWei("1", "ether"),
//   gas: 21000,
//   gasPrice: utils.toWei("10", "gwei"),
//   nonce: await web3.eth.getTransactionCount("0xYourAddress"),
// };

type Props = {
  tx: Transaction;
  privateKey: string;
};

// export async function web3SendTx({ tx, privateKey }: Props) {
//   const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
//
//   const txReceipt = await web3.eth.sendSignedTransaction(
//     signedTx.rawTransaction,
//   );
//   console.log("Transaction receipt:", txReceipt);
//   return txReceipt;
// }
//
// export async function getTransaction({ hash }: { hash: string }) {
//   return await web3.eth.getTransaction(hash);
// }

export async function etherSendTx({ tx, privateKey }: Props) {
  const signer = new Wallet(privateKey, provider);
  const hash = await signer.signTransaction(tx as any);
  const txReceipt = await provider.sendTransaction(hash);
  console.log("Transaction receipt:", txReceipt);
  return txReceipt;
}

export async function getBalance(
  accounts: Account[],
): Promise<{ address: string; balance: number }[]>;

export async function getBalance(
  accounts: Account,
): Promise<{ address: string; balance: number }>;

export async function getBalance(accounts: Account[] | Account) {
  if (Array.isArray(accounts)) {
    const balances = await Promise.all(
      accounts.map((account) => provider.getBalance(account.address)),
    );

    return accounts.map((account, index) => ({
      address: account.address,
      balance: Number(formatEther(balances[index])),
    }));
  }

  const amount = await provider
    .getBalance(accounts.address)
    .then((data) => Number(formatEther(data)));

  return {
    address: accounts.address,
    balance: amount,
  };
}

export async function getBlock() {
  const [block, ethPrice] = await Promise.all([
    etherscan.getBlock("latest"),
    etherscan.getEtherPrice(),
  ]);
  return { block, ethPrice };
}
