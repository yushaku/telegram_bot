import { Signer } from "@ethersproject/abstract-signer";
import { AddressZero } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { ChainId } from "@uniswap/sdk-core";
import { isAddress } from "ethers/lib/utils";
import { chainId } from "./token";

export function getContract(
  address: string,
  ABI: any,
  provider: JsonRpcProvider,
  account?: string,
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(
    address,
    ABI,
    getProviderOrSigner(provider, account) as any,
  );
}

// account is optional
function getProviderOrSigner(
  provider: JsonRpcProvider,
  account?: string,
): Provider | Signer {
  return account ? provider.getSigner(account).connectUnchecked() : provider;
}

export const urlScan = () => {
  switch (chainId) {
    case ChainId.GOERLI:
      return `https://goerli.etherscan.io`;

    case ChainId.MAINNET:
      return `https://etherscan.io`;

    case ChainId.SEPOLIA:
      return `https://sepolia.etherscan.io`;
  }
};
