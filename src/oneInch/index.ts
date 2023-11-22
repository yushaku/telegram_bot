import { checkTokenApproval, getTokenInfo } from "lib/tokenErc20";
import { axiosClient } from "utils/axiosClient";
import { getProvider } from "utils/networks";
import { MAIN_DAI, ONEINCH, chainId } from "utils/token";
import { GasPrice, GenerateCalldata, Quote, SwapParams, Tx } from "./types";
import { fromReadableAmount } from "utils/utils";
import { Wallet } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";

export class OneInchService {
  private provider = getProvider();

  swapParams = {
    src: MAIN_DAI,
    dst: ONEINCH,
    amount: 100,
    slippage: "1", // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false, // Set to true to allow partial filling of the swap order
  };

  account = {
    address: "0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2",
    privateKey:
      "0x82387ef67b43b3381bcb066c1a810fd2617f8d5498aeeab1ceea08ca6dca1d55",
  };

  async quote() {
    const data = await this.getQuote();
    if (!data) return { text: "Server get error 🐞" };

    const { fromToken, toToken, gas } = data;
    const text = `From ${fromToken.symbol} to ${toToken.symbol}\nGas: ${gas} Gwei\nProtocal: 1 Inch`;
    const buttons = {
      reply_markup: {
        inline_keyboard: [[{ text: "Swap", callback_data: "swap_now" }]],
      },
    };
    return { text, buttons };
  }

  async getQuote() {
    const res = await axiosClient.get(`quote`, {
      params: {
        src: this.swapParams.src.address,
        dst: this.swapParams.dst.address,
        amount: this.swapParams.amount,
        includeTokensInfo: "true",
        includeProtocols: "true",
        includeGas: "true",
      },
    });
    return res.data as Quote;
  }

  async swap() {
    const contractAddress = await this.getSpenderAddress();

    checkTokenApproval({
      token: this.swapParams.src,
      account: this.account,
      amount: 1_000_000_000 ** 18,
      provider: this.provider,
      contractAddress,
    });

    const res = await axiosClient.get("swap", {
      params: {
        src: this.swapParams.src.address,
        dst: this.swapParams.dst.address,
        amount: fromReadableAmount(
          this.swapParams.amount,
          this.swapParams.src.decimals,
        ),
        from: this.account.address,
        slippage: this.swapParams.slippage,
        includeTokensInfo: "true",
        includeProtocols: "true",
        includeGas: "true",
        allowPartialFill: "true",
        disableEstimate: "true",
      },
    });
    const data = res.data as GenerateCalldata;
    this.sendTransaction(data.tx, this.account.privateKey);
  }

  async sendTransaction(transaction: TransactionRequest, privateKey: string) {
    const signer = new Wallet(privateKey, this.provider);
    const hash = await signer.signTransaction(transaction);

    console.log(hash);

    // const { rawTransaction } = await this.web3.eth.accounts.signTransaction(
    //   transaction,
    //   privateKey,
    // );
    //
    // console.log(rawTransaction);

    // const res = await axiosClient.post(BROADCAST_API_URL, { rawTransaction });
    // console.log(res.data);
  }

  async getGasPrice() {
    const res = await axiosClient.get(
      `https://api.1inch.dev/gas-price/v1.4/${chainId}`,
    );
    return res.data as GasPrice;
  }

  async getSpenderAddress(): Promise<string> {
    const res = await axiosClient.get("approve/spender");
    return res.data?.address ?? "";
  }

  async test() {
    const contractAddress = await this.getSpenderAddress();

    const { balance, symbol } = await getTokenInfo({
      tokenAddress: this.swapParams.src.address,
      walletAddress: this.account.address,
      provider: this.provider,
    });

    console.log(`${symbol} token balance: ${balance}`);
    if (Number(balance) < this.swapParams.amount) {
      return { text: "Not enough token", buttons: {} };
    }

    await checkTokenApproval({
      token: this.swapParams.src,
      account: this.account,
      amount: this.swapParams.amount,
      provider: this.provider,
      contractAddress,
    });

    const params: SwapParams = {
      src: this.swapParams.src.address,
      dst: this.swapParams.dst.address,
      amount: (
        this.swapParams.amount *
        10 ** this.swapParams.src.decimals
      ).toString(),
      from: this.account.address,
      slippage: this.swapParams.slippage,
      includeTokensInfo: false,
      includeProtocols: false,
      includeGas: true,
      allowPartialFill: true,
      disableEstimate: true,
    };
    console.log(params);

    const res = await axiosClient.get("swap", { params });
    console.log({ tx: res?.data?.tx });

    const data = res?.data as GenerateCalldata;
    if (!data?.tx) return { text: "❌ Get router failed", buttons: {} };

    this.sendTransaction(data.tx, this.account.privateKey);
    return { text: "ok", buttons: {} };
  }
}
