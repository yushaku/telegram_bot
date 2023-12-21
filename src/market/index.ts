import { httpClient } from "@/utils/axiosClient";
import {
  COIN_MARKET_KEY,
  DexMap,
  ETHERSCAN_ID,
  ETH_PLORER,
  MORALIS_KEY,
  hashOfTransferTx,
} from "@/utils/constants";
import {
  MoralistokenPrice,
  ScanWallet,
  TopHolder,
  moralisChain,
  url,
} from "./types";
import { url as urlProvider } from "@/utils/networks";
import { chainId } from "@/utils/token";
import {
  AnalysisTransaction,
  EtherscanHistory,
  ParseLog,
} from "@/tracker/types";
import Web3, { Log } from "web3";
import { stableCoinList } from "@/utils/stableCoin";
import { Erc20Token } from "@/lib/Erc20token";

export class CoinMarket {
  private provider = new Web3(urlProvider);

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
    baseURL: "https://api.etherscan.io/api",
  });

  async tokenInfo(address: string) {
    return this.coinmarket.get(`cryptocurrency/quotes/latest`, {
      params: {
        symbol: "UNI",
        convert: "USD",
      },
    });
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

  async getWalletHistory(address: string, startblock = 0) {
    try {
      const res = await fetch(
        `https://api.etherscan.io/api?address=${address}&module=account&action=txlist&startblock=${startblock}&endblock=99999999&apikey=${ETHERSCAN_ID}`,
      );
      const data = await res.json();
      return data as EtherscanHistory;
    } catch (error) {
      console.error(error);
    }
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
        exchange: "uniswapv3",
        to_block: blockNumber,
      },
    });
    return res.data as MoralistokenPrice;
  }

  async analysisHisory(address: string, blockNumber: number) {
    const data = await this.getWalletHistory(address, blockNumber);
    if (!data) return;

    const transactions: Array<AnalysisTransaction> = [];
    let maxBlockNumber = Number(data.result?.at(0)?.blockNumber) ?? 0;

    for (let i = 0; i < data.result.length; i++) {
      const tx = data.result[i];
      const userAdd = tx.from;
      const blockNumber = tx.blockNumber;
      const timestamp = tx.timeStamp;

      if (maxBlockNumber < Number(blockNumber)) {
        maxBlockNumber = Number(blockNumber);
      }

      if (!DexMap.has(tx.to.toLocaleLowerCase())) continue;

      try {
        const receive = await this.getDetailTX(tx.hash);
        for (let i = 0; i < receive.length; i++) {
          const log = receive[i];
          if (!log || stableCoinList.has(log.address)) return;

          const res = await this.tokenPrice({
            tokenAddr: log.address,
            blockNumber,
          });

          const price = Number(res.usdPrice.toFixed(6));
          const transaction = {
            hash: tx.hash,
            address: log.address,
            symbol: log.symbol,
            amount: log.amount,
            price,
            total: log.amount * price,
            timestamp: new Date(Number(timestamp) * 1000),
            action: log.to === userAdd ? "BUY" : "SELL",
          };
          transactions.push(transaction);
        }
      } catch (error) {
        console.error(error);
      }
    }

    return {
      transactions,
      blockNumber: maxBlockNumber,
    };
  }

  async getDetailTX(hash: string) {
    const detail = await this.provider.eth.getTransactionReceipt(hash);
    const userAdd = detail.from;

    const promiseTransfers = detail.logs
      .filter((log) => {
        const hashFunc = log.topics?.at(0);
        const topic1 = log.topics?.at(1)?.toString();
        const topic2 = log.topics?.at(2)?.toString();

        const from = "0x" + topic1?.slice(26);
        const to = "0x" + topic2?.slice(26);

        if (
          hashFunc === hashOfTransferTx &&
          (from === userAdd || to === userAdd)
        ) {
          console.log(log);
          return true;
        }
      })
      .map((log) => this.convertLog(log));

    return Promise.all(promiseTransfers);
  }

  async convertLog(log: Log): Promise<ParseLog | undefined> {
    const from = log.topics?.at(1)?.toString();
    const to = log.topics?.at(2)?.toString();

    if (!log?.address || !from || !to) return;
    const token = new Erc20Token(log.address);
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.getDecimals(),
    ]);

    const amount = Number(log.data) / 10 ** decimals;

    return {
      name,
      symbol,
      decimals,
      amount,
      address: log.address,
      from: "0x" + from.slice(26),
      to: "0x" + to.slice(26),
    };
  }
}
