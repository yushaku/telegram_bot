import { Currency } from "@uniswap/sdk-core";
import JSBI from "jsbi";

import { toReadableAmount } from "./utils";
import {
  ERC20_ABI,
  WETH_CONTRACT_ADDRESS,
  WETH_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
} from "./token";
import { getProvider, getWalletAddress, sendTransaction } from "./provider";
import { BigNumber, ethers, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";

export async function getCurrencyBalance(
  provider: providers.Provider,
  address: string,
  currency: Currency,
): Promise<string> {
  if (currency.isNative) {
    return formatEther(await provider.getBalance(address));
  }

  // Get currency otherwise
  const ERC20Contract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider,
  );
  const balance: number = await ERC20Contract.balanceOf(address);
  const decimals: number = await ERC20Contract.decimals();

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals);
}

// wraps ETH (rounding up to the nearest ETH for decimal places)
export async function wrapETH(eth: number) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    throw new Error("Cannot wrap ETH without a provider and wallet address");
  }

  const wethContract = new ethers.Contract(
    WETH_CONTRACT_ADDRESS,
    WETH_ABI,
    provider,
  );

  const transaction = {
    data: wethContract.interface.encodeFunctionData("deposit"),
    value: BigNumber.from(Math.ceil(eth))
      .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
      .toString(),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  await sendTransaction(transaction);
}

// unwraps ETH (rounding up to the nearest ETH for decimal places)
export async function unwrapETH(eth: number) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    throw new Error("Cannot unwrap ETH without a provider and wallet address");
  }

  const wethContract = new ethers.Contract(
    WETH_CONTRACT_ADDRESS,
    WETH_ABI,
    provider,
  );

  const transaction = {
    data: wethContract.interface.encodeFunctionData("withdraw", [
      BigNumber.from(Math.ceil(eth))
        .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
        .toString(),
    ]),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  await sendTransaction(transaction);
}
