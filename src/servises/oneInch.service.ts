import axios from "axios";
import { ethers } from "ethers";
import { getProvider } from "lib/provider";
import { API_BASE_URL, ONE_INCH_KEY } from "utils/constants";
import { ONEINCH, USDC } from "utils/token";

export class OneInchService {
  public client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      Accept: "application/json",
      "Content-Type": "json",
      Authorization: `Bearer ${ONE_INCH_KEY}`,
    },
  });

  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = getProvider();
  }

  async test(address: string) {
    const amount = 100000000000;
    const swapParams = {
      src: ONEINCH.address, // Token address of 1INCH
      dst: USDC.address, // Token address of DAI
      amount: "100000000000000000", // Amount of 1INCH to swap (in wei)
      from: address, // User address
      slippage: 50 / 10_000, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
      disableEstimate: false, // Set to true to disable estimation of swap details
      allowPartialFill: false, // Set to true to allow partial filling of the swap order
    };

    const a = await this.client.get(
      `/approve/transaction?tokenAddress=${ONEINCH.address}&amount=${amount}`,
    );
    console.log(a);
  }
}
