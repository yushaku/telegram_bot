import { httpClient } from "@/utils/axiosClient";
import {
  COIN_MARKET_KEY,
  ETHERSCAN_ID,
  ETH_PLORER,
  MORALIS_KEY,
} from "@/utils/constants";
import { MoralistokenPrice, ScanWallet, TopHolder } from "./types";
import { chainId } from "@/utils/token";
import { ChainId } from "@uniswap/sdk-core";
import { EtherscanHistory } from "@/tracker/types";

const url = () => {
  switch (chainId) {
    case ChainId.MAINNET:
      return "https://api.ethplorer.io/";
    case ChainId.GOERLI:
      return "https://goerli-api.ethplorer.io/";
    case ChainId.SEPOLIA:
      return "https://sepolia-api.ethplorer.io/";
    case ChainId.BNB:
      return "https://api.binplorer.io/";
    default:
      return "https://api.ethplorer.io/";
  }
};

const moralisChain = {
  1: "eth",
  5: "goerli",
  11155111: "sepolia",
  137: "polygon",
  80001: "mumbai",
  100: "gnosis",
  56: "bsc",
  8453: "base",
  42161: "arbitrum",
};

export class CoinMarket {
  protected coinmarket = httpClient({
    baseURL: "https://pro-api.coinmarketcap.com/v1/",
    headers: {
      Authorization: `Bearer ${COIN_MARKET_KEY}`,
      "X-CMC_PRO_API_KEY": COIN_MARKET_KEY,
    },
  });

  protected ethplorer = httpClient({
    baseURL: url(),
    headers: {
      Authorization: `Bearer ${ETH_PLORER}`,
      "X-CMC_PRO_API_KEY": ETH_PLORER,
    },
  });

  protected moralis = httpClient({
    baseURL: "https://deep-index.moralis.io/api/v2.2/",
    headers: { "X-API-Key": MORALIS_KEY },
  });

  protected etherscan = httpClient({
    baseURL: "https://api.etherscan.io/api/",
  });

  async tokenInfo(address: string) {
    const a = await this.coinmarket.get(`cryptocurrency/quotes/latest`, {
      params: {
        symbol: "UNI",
        convert: "USD",
      },
    });

    console.log(a.data);
  }

  async scanWallet(address: string): Promise<ScanWallet> {
    const a = await this.ethplorer.get(`getAddressInfo/${address}`, {
      params: {
        apiKey: "freekey",
      },
    });
    // Bun.write("./scan.json", JSON.stringify(a.data, null, 2));
    return a.data as ScanWallet;
  }

  async topToken(limit = 10) {
    const res = await this.ethplorer.get("getTop", {
      params: {
        apiKey: "freekey",
        limit,
      },
    });
    return res.data;
  }

  async topTokenHolders(address: string, limit = 10) {
    const res = await this.ethplorer.get(`getTopTokenHolders/${address}`, {
      params: {
        apiKey: "freekey",
        limit,
      },
    });
    return res.data?.holders as TopHolder[] | undefined;
  }

  // async getHistory(address: string, limit = 10, type = "transfer") {
  //   const res = await this.ethplorer.get(`getAddressHistory/${address}`, {
  //     params: {
  //       apiKey: "freekey",
  //       limit,
  //     },
  //   });
  //   Bun.write("./ts.json", JSON.stringify(res.data, null, 2));
  //   return res.data;
  // }

  async getWalletHistory(address: string) {
    const res = await this.etherscan.get("?module=account", {
      params: {
        address,
        action: "txlist",
        startblock: 0,
        endblock: 9999999999,
        apikey: ETHERSCAN_ID,
      },
    });

    return res.data as EtherscanHistory;
  }

  async tokenPrice({
    tokenAddr,
    blockNumber,
  }: {
    tokenAddr: string;
    blockNumber: number | string;
  }) {
    const res = await this.moralis.get(`erc20/${tokenAddr}/price`, {
      params: {
        chain: moralisChain[chainId as keyof typeof moralisChain],
        exchange: "uniswapv2",
        to_block: blockNumber,
      },
    });
    return res.data as MoralistokenPrice;
  }
}
