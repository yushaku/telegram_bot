import TelegramBot, { User } from "node-telegram-bot-api";
import { v4 as uuidv4 } from "uuid";
import { CLOSE, ETHERSCAN_ID, INFURA_ID, INIT_POOL } from "../utils/constants";
import {
  esstimateSwap,
  tokenDetail,
  walletDetail,
  walletMsg,
} from "../utils/replyMessage";
import {
  parseKey,
  createAccount,
  bigintToNumber,
  shortenAddress,
  shortenAmount,
} from "../utils/utils";
import { Account, PositionInfo, isTransaction } from "../utils/types";
import { RedisService } from "./redis.service";
import { UniswapService } from "./uniswap.service";
import { providers } from "ethers";
import { UNI, WETH, chainId } from "../utils/token";
import { Token } from "@uniswap/sdk-core";

export class TeleService {
  private provider: providers.InfuraProvider;
  private etherscan: providers.EtherscanProvider;
  private cache: RedisService;
  private uniswap: UniswapService;

  constructor() {
    this.provider = new providers.InfuraProvider(1, INFURA_ID);
    this.etherscan = new providers.EtherscanProvider(1, ETHERSCAN_ID);
    this.uniswap = new UniswapService();
    this.cache = new RedisService();
  }

  async hi(userId: number) {
    const user = await this.cache.getUser(userId);
    const account = user.accounts.at(0);
    if (!account) return;

    const tokenA = WETH;
    const tokenB = UNI;
    const amount = 0.01;

    console.log("check approval");

    this.uniswap.checkTokenApproval({
      token: tokenA,
      account,
      amount,
    });

    console.log("create trade");

    const trade = await this.uniswap.createTrade({
      tokenA,
      tokenB,
      amount,
    });

    console.log("execute trade");

    const a = await this.uniswap.executeTrade({ trade, account });

    if (!isTransaction(a)) return a;

    console.log(a.hash);
    return `Buying...\nCheckout [etherscan](https://goerli.etherscan.io/tx/${a.hash})`;

    // const receive: TransactionReceipt = await a.wait();
    // console.log(receive);
    // if (receive.status === 0) return "Swap transaction failed";
    // else return `Buy completed \n checkout etherscan  https://goerli.etherscan.io/${receive.transactionHash}`;
  }

  async hello(userId: number) {
    const user = await this.cache.getUser(userId);
    const account = user.accounts.at(0);
    if (!account) return;

    const tokenA = WETH;
    const tokenB = UNI;
    const amount = 0.01;

    console.log("check approval");

    this.uniswap.checkTokenApproval({
      token: tokenA,
      account,
      amount,
    });

    console.log("create trade");

    const route = await this.uniswap.generateRoute({
      walletAddress: account.address,
      tokenA,
      tokenB,
      amount,
    });

    if (!route) return "create route failed";

    console.log("execute trade");
    const tx = await this.uniswap.executeRoute({ route, account });
    if (!isTransaction(tx)) return "Route execute failed";

    const receive = await tx.wait();
    if (receive.status === 0) {
      return "Swap transaction failed";
    }
    return `Buy completed\ncheckout [etherscan](https://goerli.etherscan.io/${receive.transactionHash})`;
  }

  async conichiwa(userId: number) {
    const user = await this.cache.getUser(userId);
    const account = user.accounts.at(0);
    if (!account) return;

    const tokenA = WETH;
    const tokenB = UNI;
    const amount = 0.01;

    const ids = await this.uniswap.getPositionIds(account.address);
    const positionsInfo = await Promise.all(
      ids.map((id) => this.uniswap.getPositionInfo(id)),
    );

    positionsInfo
      .map((id, index) => [id, positionsInfo[index]])
      .map((info) => {
        const id = info[0];
        const posInfo = info[1] as PositionInfo;
        return `${id}: ${posInfo.liquidity.toString()} liquidity, owed ${posInfo.tokensOwed0.toString()} and ${posInfo.tokensOwed1.toString()}`;
      })
      .join("\n");

    return {
      text: `List your pools \n ${positionsInfo}`,
      buttons: {
        reply_markup: {
          inline_keyboard: [[{ text: "Init pool", callback_data: INIT_POOL }]],
        },
      },
    };
  }
  async initPool(userId: number) {
    const user = await this.cache.getUser(userId);
    const account = user.accounts.at(0);
    if (!account) return;

    const tokenA = WETH;
    const tokenB = UNI;
    const amountA = 0.01;
    const amountB = 0.01;

    this.uniswap.mintPosition({
      account,
      tokenA,
      tokenB,
      amountA,
      amountB,
    });
  }

  async commandStart(user: User) {
    const { id, first_name, last_name } = user;
    const userInfo = await this.cache.getUser(id);
    if (userInfo) return userInfo;

    const defalt = {
      name: `${first_name} ${last_name}`,
      accounts: [],
      slippage: 10,
      maxGas: 10,
    };

    this.cache.setUser(id, defalt);
    return defalt;
  }

  async setConfig(type: "slippage" | "maxGas", userId: number, num: number) {
    const user = await this.cache.getUser(userId);
    await this.cache.setUser(userId, {
      ...user,
      [type]: num,
    });

    return `Set ${type} to ${num} ${
      type === "slippage" ? "%" : "gwei"
    } successfully`;
  }

  async commandWallet(userId: number) {
    const user = await this.cache.getUser(userId);
    const [accounts, block] = await Promise.all([
      this.getBalance(user.accounts),
      this.getBlock(),
    ]);

    return walletMsg({
      block: block?.block?.number ?? 0,
      ethPrice: block.ethPrice,
      accounts: accounts,
    });
  }

  async importWallet(userId: number, key: string) {
    const acc = parseKey(key);

    const user = await this.cache.getUser(userId);
    const isExist = user.accounts.some((item) => item.address === acc.address);
    if (isExist) return "Wallet already exist";

    await this.cache.setUser(userId, {
      ...user,
      accounts: [
        ...user?.accounts,
        {
          address: acc.address,
          privateKey: acc.privateKey,
          mnemonic: null,
        },
      ],
    });
    return "Import successfully";
  }

  async createWallet(userId: number) {
    const acc = createAccount();
    const user = await this.cache.getUser(userId);
    this.cache.setUser(userId, {
      ...user,
      accounts: [
        ...user?.accounts,
        {
          address: acc.address,
          mnemonic: acc.mnemonic?.phrase,
          privateKey: acc.privateKey,
        },
      ],
    });
    return acc;
  }

  async listWallet(userId: number): Promise<TelegramBot.SendMessageOptions> {
    const user = await this.cache.getUser(userId);
    const accountList = user.accounts?.map((acc) => [
      {
        text: shortenAddress(acc.address, 8),
        callback_data: `detail_wallet ${acc.address}`,
      },
      { text: "❌ Delete", callback_data: `remove_wallet ${acc.address}` },
    ]);

    return {
      reply_markup: {
        inline_keyboard: accountList,
      },
    };
  }

  async deleteWallet(userId: number, address: string) {
    const user = await this.cache.getUser(userId);
    console.log(user);

    const accounts = user.accounts.filter((acc) => acc.address !== address);
    await this.cache.setUser(userId, { ...user, accounts });
    return "Delete successfully";
  }

  async checkToken({ address, userId }: { address: string; userId: number }) {
    const user = await this.cache.getUser(userId);
    const { name, symbol, decimals } = await this.uniswap.getTokenInfo({
      tokenAddress: address,
      walletAddress: user.accounts.at(0)?.address,
    });

    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💸 Buy by 0.1ETH",
              callback_data: `buy_token ${address}`,
            },
            {
              text: "💸 Buy custom amount",
              callback_data: `buy_custom ${address}`,
            },
          ],
          [
            { text: "↪️  Buy Menu", callback_data: `sell ${address}` },
            { text: "🎛️ Menu", callback_data: "MENU" },
          ],
          [{ text: "❎ Close", callback_data: CLOSE }],
        ],
      },
    };

    return {
      buttons,
      text: tokenDetail({
        name,
        symbol,
        address,
        decimals,
        supply: 1000,
        marketcap: 100000,
        price: 10000,
      }),
    };
  }

  async estimatePrice({
    userId,
    amount,
    tokenAddress,
  }: {
    userId: number;
    amount: number;
    tokenAddress: string;
  }) {
    const tokenA = WETH;
    const tokenB = new Token(chainId, tokenAddress, 18);

    const user = await this.cache.getUser(userId);
    const walletAddress = user.accounts?.at(0)?.address;

    if (!walletAddress)
      return {
        text: "User haven't got wallet",
      };

    const [pair, route] = await Promise.all([
      this.uniswap.checkBalance({
        walletAddress,
        tokens: { tokenA, tokenB },
      }),
      this.uniswap.generateRoute({
        walletAddress,
        tokenA,
        tokenB,
        amount,
      }),
    ]);

    if (!route) {
      return { text: "Token do not support", buttons: null };
    }

    const id = uuidv4();
    this.cache.setRoutes(id, route);

    const ratio = shortenAmount(route.quote.toExact() ?? 0);
    const buttonConfirm =
      Number(pair.tokenA.balance) >= amount
        ? { text: "👌 Confirm", callback_data: `confirm_swap ${id}` }
        : { text: "💔 Don't enough token", callback_data: CLOSE };

    return {
      text: esstimateSwap({
        tokenA: pair.tokenA.symbol,
        tokenB: pair.tokenB.symbol,
        amountIn: amount,
        amountOut: shortenAmount(amount / ratio),
        amountA: shortenAmount(pair.tokenA.balance),
        amountB: shortenAmount(pair.tokenB.balance),
        gwei: shortenAmount(route.gasPriceWei.toString() ?? 0),
        dollars: shortenAmount(route.estimatedGasUsedUSD.toExact() ?? 0),
        ratio,
      }),
      buttons: {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⭕ No", callback_data: CLOSE }, buttonConfirm],
          ],
        },
      },
    };
  }

  async confirmSwap({ id, userId }: { id: string; userId: number }) {
    const [data, user] = await Promise.all([
      this.cache.getRoute(id),
      this.cache.getUser(userId),
    ]);

    const wallet = user.accounts?.at(0);
    const token = data?.route.at(0)?.route.input;

    if (!data || !token) return "Transaction is expired";
    if (!wallet) return "No wallet found";

    console.log("approved token");

    await this.uniswap.checkTokenApproval({
      token,
      account: wallet,
      amount: 100,
    });

    console.log("start swappp");

    const result = await this.uniswap.executeRoute({
      account: wallet,
      route: data,
    });
    console.log(result);

    return result;
  }

  async getDetails(wallet: string) {
    const [balance, block] = await Promise.all([
      this.provider.getBalance(wallet),
      this.getBlock(),
    ]);

    return walletDetail({
      block: block.block?.number ?? 0,
      ethPrice: block.ethPrice,
      balance: bigintToNumber(balance),
    });
  }

  async getBalance(accList: Account[]) {
    const balances = await Promise.all(
      accList.map((account) => this.provider.getBalance(account.address)),
    );

    return accList.map((account, index) => ({
      address: account.address,
      balance: bigintToNumber(balances[index]),
    }));
  }

  async getBlock() {
    const [block, ethPrice] = await Promise.all([
      this.etherscan.getBlock("latest"),
      this.etherscan.getEtherPrice(),
    ]);
    return { block, ethPrice };
  }
}
