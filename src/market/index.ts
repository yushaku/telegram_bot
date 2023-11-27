import { httpClient } from "@/utils/axiosClient";
import { COIN_MARKET_KEY } from "@/utils/constants";
import { ScanWallet } from "./types";
import { chainId } from "@/utils/token";
import { ChainId } from "@uniswap/sdk-core";

const urlScan = () => {
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

export class CoinMarket {
  protected coinmarket = httpClient({
    baseURL: "https://pro-api.coinmarketcap.com/v1/",
    key: COIN_MARKET_KEY,
  });

  protected ethplorer = httpClient({
    baseURL: urlScan(),
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
    return res.data;
  }

  async getHistory(address: string, limit = 10, type = "transfer") {
    const res = await this.ethplorer.get(`getAddressHistory/${address}`, {
      params: {
        apiKey: "freekey",
        limit,
        type,
      },
    });
    return res.data;
  }
}
