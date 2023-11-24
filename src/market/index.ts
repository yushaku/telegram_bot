import { httpClient } from "@/utils/axiosClient";
import { COIN_MARKET_KEY } from "@/utils/constants";

export class CoinMarket {
  protected axios = httpClient({
    baseURL: "https://pro-api.coinmarketcap.com/v1/",
    key: COIN_MARKET_KEY,
  });

  async tokenInfo(address: string) {
    const a = await this.axios.get(`cryptocurrency/quotes/latest`, {
      params: {
        symbol: "UNI",
        convert: "USD",
      },
    });

    console.log(a.data);
  }
}
