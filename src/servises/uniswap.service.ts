import { Contract, ethers } from "ethers";
import { Currency } from "@uniswap/sdk-core";
import erc20ABI from "../abis/erc20.json";
import { toReadableAmount } from "../utils/utils";
import { GOERLI_UNI, GOERLI_WETH } from "../utils/token";
import { FeeAmount } from "@uniswap/v3-sdk";
import { getProvider } from "../utils/provider";
import { getPoolInfoV2, getPoolInfoV3 } from "../utils/pools";
import { generateRoute } from "../utils/routing";

export class UniswapService {
  private provider: ethers.providers.BaseProvider;

  constructor() {
    // this.provider = new InfuraProvider(chainId, INFURA_ID);
    this.provider = getProvider();
  }

  async checkBalance(address: string) {
    const tokens = {
      in: GOERLI_UNI,
      out: GOERLI_WETH,
      amountIn: 1,
      poolFee: FeeAmount.MEDIUM,
    };

    // const [tokenA, tokenB] = await Promise.all([
    //   this.getCurrencyBalance(address, tokens.in),
    //   this.getCurrencyBalance(address, tokens.out),
    // ]);
    // console.log({ tokenA, tokenB });

    const route = await generateRoute(
      address,
      tokens.in,
      tokens.out,
      tokens.amountIn,
    );
    console.log(route);

    const [poolv2, poolv3] = await Promise.all([
      getPoolInfoV2(tokens.in, tokens.out),
      getPoolInfoV3(tokens.in, tokens.out, tokens.poolFee),
    ]);

    console.log({
      poolv2,
    });
  }

  async getCurrencyBalance(address: string, currency: Currency) {
    if (currency.isNative) {
      return ethers.utils.formatEther(await this.provider.getBalance(address));
    }

    const contractERC20 = new Contract(
      currency.address,
      erc20ABI,
      this.provider,
    );

    const [balance, decimals] = await Promise.all([
      contractERC20.balanceOf(address),
      contractERC20.decimals(),
    ]);

    return toReadableAmount(balance, decimals);
  }
}
