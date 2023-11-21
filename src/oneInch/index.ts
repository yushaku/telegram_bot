import axios from "axios";
import { API_BASE_URL, ONE_INCH_KEY } from "utils/constants";
import { ONEINCH, USDC, chainId } from "utils/token";
import { Short } from "./types";
import Web3 from "web3";
import { RPC_URLS, getProvider } from "utils/networks";

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

  web3 = new Web3(RPC_URLS[chainId]);
  provider = getProvider();

  swapParams = {
    src: ONEINCH.address, // Token address of 1INCH
    dst: USDC.address, // Token address of DAI
    amount: "100000000000000000", // Amount of 1INCH to swap (in wei)
    from: "0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1", // User address
    slippage: 50 / 10_000, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false, // Set to true to allow partial filling of the swap order
  };

  async quote() {
    const res = await this.client.get(`quote`, {
      params: {
        src: this.swapParams.src,
        dst: this.swapParams.dst,
        amount: this.swapParams.amount,
        fee: "1",
        includeTokensInfo: true,
        includeProtocols: true,
        includeGas: true,
      },
    });
    const { fromToken, toToken, gas, protocols } = res.data as Short;
    const text = `From ${fromToken.symbol} to ${toToken.symbol}\nGas: ${gas} Gwei\nProtocal: 1 Inch`;
    const buttons = {
      reply_markup: {
        inline_keyboard: [[{ text: "Swap", callback_data: `swap_now` }]],
      },
    };

    return {
      text,
      buttons,
    };
  }

  async swap() {
    const res = await this.client.get(`swap`, {
      params: {
        src: this.swapParams.src,
        dst: this.swapParams.dst,
        amount: this.swapParams.amount,
        from: this.swapParams.from,
        slippage: this.swapParams.slippage,
        includeTokensInfo: "true",
        includeProtocols: "true",
        includeGas: "true",
        allowPartialFill: "true",
      },
    });

    console.log(JSON.stringify(res.data));
  }
}
