import { Erc20Token } from "@/lib/Erc20token";
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  V2_SWAP_ROUTER_ADDRESS,
} from "@/utils/constants";
import { SingletonProvider } from "@/utils/networks";
import { chainId } from "@/utils/token";
import {
  fromReadableAmount,
  fromReadableToAmount,
  toReadableAmount,
} from "@/utils/utils";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from "@uniswap/smart-order-router";
import { Pair, Route as RouteV2 } from "@uniswap/v2-sdk";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import {
  FACTORY_ADDRESS as FACTORY_ADDRESS_V3,
  FeeAmount,
  Pool,
  Position,
  Route,
  SwapQuoter,
  SwapRouter,
  Trade,
  computePoolAddress,
  nearestUsableTick,
} from "@uniswap/v3-sdk";
import uniswapV2poolABI from "abis/uniV2pool.json";
import { TransactionRequest } from "alchemy-sdk";
import { BigNumber, Contract, Wallet, ethers } from "ethers";
import JSBI from "jsbi";
import { Account } from "utils/types";
import { PoolInfo, PositionInfo, TransactionState } from "./types";

export class UniswapService {
  protected provider = SingletonProvider.getInstance();

  async checkBalance({
    walletAddress,
    tokens,
  }: {
    walletAddress: string;
    tokens: { tokenA: Token; tokenB: Token };
  }) {
    const token1 = tokens.tokenA;
    const token2 = tokens.tokenB;

    const contractA = new Erc20Token(token1.address);
    const contractB = new Erc20Token(token2.address);

    const [tokenA, tokenB] = await Promise.all([
      contractA.getInfo(walletAddress),
      contractB.getInfo(walletAddress),
    ]);

    return { tokenA, tokenB };
  }

  async quote({
    tokenA,
    tokenB,
    amount,
    account,
  }: {
    tokenA: Token;
    tokenB: Token;
    amount: number;
    account: Account;
  }) {
    const result = await this.getQuote({ tokenA, tokenB, amount, account });
    console.log(result);
  }

  async getPositionIds(address: string) {
    const positionContract = new ethers.Contract(
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      NONFUNGIBLE_POSITION_MANAGER_ABI,
      this.provider,
    );

    const balance: number = await positionContract.balanceOf(address);

    // Get all positions
    const tokenIds = [];
    for (let i = 0; i < balance; i++) {
      const tokenOfOwnerByIndex: number =
        await positionContract.tokenOfOwnerByIndex(address, i);
      tokenIds.push(tokenOfOwnerByIndex);
    }

    return tokenIds;
  }

  async getPositionInfo(tokenId: number): Promise<PositionInfo> {
    const positionContract = new ethers.Contract(
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      NONFUNGIBLE_POSITION_MANAGER_ABI,
      this.provider,
    );

    const position = await positionContract.positions(tokenId);

    return {
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
      liquidity: position.liquidity,
      feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
      feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
      tokensOwed0: position.tokensOwed0,
      tokensOwed1: position.tokensOwed1,
    };
  }

  async constructPosition(
    tokenA: CurrencyAmount<Token>,
    tokenB: CurrencyAmount<Token>,
  ): Promise<Position> {
    // get pool info
    const poolInfo = await this.getPoolV3(tokenA.currency, tokenB.currency);

    // construct pool instance
    const configuredPool = new Pool(
      tokenA.currency,
      tokenB.currency,
      poolInfo.fee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick,
    );

    // create position using the maximum liquidity from input amounts
    return Position.fromAmounts({
      pool: configuredPool,
      tickLower:
        nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
        poolInfo.tickSpacing * 2,
      tickUpper:
        nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
        poolInfo.tickSpacing * 2,
      amount0: tokenA.quotient,
      amount1: tokenB.quotient,
      useFullPrecision: true,
    });
  }

  async getPoolV3(tokenA: Token, tokenB: Token): Promise<PoolInfo> {
    const poolAddress = computePoolAddress({
      factoryAddress: FACTORY_ADDRESS_V3,
      tokenA,
      tokenB,
      fee: FeeAmount.MEDIUM,
    });

    const poolContract = new Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      this.provider,
    );

    const [token0, token1, fee, tickSpacing, liquidity, slot0] =
      await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

    return {
      token0,
      token1,
      fee,
      tickSpacing,
      liquidity,
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
    };
  }

  async getPoolV2(tokenA: Token, tokenB: Token): Promise<Pair> {
    const pairAddress = Pair.getAddress(tokenA, tokenB);

    const pairContract = new ethers.Contract(
      pairAddress,
      uniswapV2poolABI,
      this.provider,
    );
    const [reserve0, reserve1] = await pairContract["getReserves"]();

    const tokens = [tokenA, tokenB];
    const [token0, token1] = tokens[0].sortsBefore(tokens[1])
      ? tokens
      : [tokens[1], tokens[0]];

    return new Pair(
      CurrencyAmount.fromRawAmount(token0, reserve0),
      CurrencyAmount.fromRawAmount(token1, reserve1),
    );
  }

  async getRouteV2(tokenA: Token, tokenB: Token) {
    const pair = await this.getPoolV2(tokenA, tokenB);
    const route = new RouteV2([pair], tokenB, tokenA);
    console.log(route.midPrice.toSignificant(6)); // 1901.08
    console.log(route.midPrice.invert().toSignificant(6)); // 0.000526017
    return route;
  }

  async getQuote({
    tokenA,
    tokenB,
    amount,
    account,
  }: {
    tokenA: Token;
    tokenB: Token;
    amount: number;
    account: Account;
  }): Promise<string> {
    const signer = new Wallet(account.privateKey, this.provider);
    const quoterContract = new ethers.Contract(
      QUOTER_CONTRACT_ADDRESS,
      Quoter.abi,
      signer,
    );

    const poolConstants = await this.getPoolConstants({ tokenA, tokenB });
    const quotedAmountOut = await quoterContract.quoteExactInputSingle(
      poolConstants.token0,
      poolConstants.token1,
      poolConstants.fee,
      fromReadableAmount(amount, tokenA.decimals).toString(),
      0,
    );

    return toReadableAmount(quotedAmountOut, tokenB.decimals);
  }

  async getPoolConstants({ tokenA, tokenB }: { tokenA: Token; tokenB: Token }) {
    const currentPoolAddress = computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
      tokenA,
      tokenB,
      fee: FeeAmount.MEDIUM,
    });

    const poolContract = new ethers.Contract(
      currentPoolAddress,
      IUniswapV3PoolABI.abi,
      this.provider,
    );

    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
    ]);

    return {
      token0,
      token1,
      fee,
    };
  }

  async generateTrade({
    tokenA,
    tokenB,
    amount,
    fee = FeeAmount.MEDIUM,
  }: {
    tokenA: Token;
    tokenB: Token;
    fee?: FeeAmount;
    amount: number;
  }) {
    const poolInfo = await this.getPoolV3(tokenA, tokenB);
    const pool = new Pool(
      tokenA,
      tokenB,
      fee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick,
    );

    const swapRoute = new Route([pool], tokenA, tokenB);
    const amountOut = await this.getOutputQuote({
      route: swapRoute,
      tokenA,
      amount,
    });

    const uncheckedTrade: Trade<Currency, Currency, TradeType> =
      Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
          tokenA,
          fromReadableAmount(amount, tokenA.decimals).toString(),
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
          tokenB,
          JSBI.BigInt(amountOut),
        ),
        tradeType: TradeType.EXACT_INPUT,
      });

    return uncheckedTrade;
  }

  async executeTrade({
    trade,
    account,
  }: {
    trade: Trade<Currency, Currency, TradeType>;
    account: Account;
  }) {
    const methodParameters = SwapRouter.swapCallParameters([trade], {
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      recipient: account.address,
    });

    const tx = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      from: account.address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    };

    return this.sendTransaction({ tx, account });
  }

  async generateRoute({
    walletAddress,
    tokenA,
    tokenB,
    amount,
    account,
  }: {
    walletAddress: string;
    tokenA: Token;
    tokenB: Token;
    amount: number;
    account: Account;
  }): Promise<SwapRoute | null> {
    const tokenIn = new Erc20Token(tokenA.address);

    const res = await tokenIn.checkTokenApproval({
      amount,
      account,
      spender: SWAP_ROUTER_ADDRESS,
    });
    if (res === TransactionState.Failed) return null;

    const router = new AlphaRouter({
      chainId,
      provider: this.provider,
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: walletAddress,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 30 * 60), // 30 mins deadline
      type: SwapType.SWAP_ROUTER_02,
    };

    const amountIn = CurrencyAmount.fromRawAmount(
      tokenA,
      fromReadableToAmount(amount, tokenA.decimals).toString(),
    );

    console.log({ amountIn });

    const route = await router.route(
      amountIn,
      tokenB,
      TradeType.EXACT_INPUT,
      options,
    );

    return route;
  }

  async executeRoute({
    route,
    account,
  }: {
    route: SwapRoute;
    account: Account;
  }) {
    const tx = {
      chainId,
      from: account.address,
      to: V2_SWAP_ROUTER_ADDRESS,
      data: route.methodParameters?.calldata,
      value: BigNumber.from(route?.methodParameters?.value),
    };

    try {
      return this.sendTransaction({ account, tx });
    } catch (error) {
      console.log(error);
      return "Buy token failed";
    }
  }

  async getOutputQuote({
    route,
    tokenA,
    amount,
  }: {
    route: Route<Currency, Currency>;
    tokenA: Token;
    amount: number;
  }) {
    const { calldata } = SwapQuoter.quoteCallParameters(
      route,
      CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableAmount(amount, tokenA.decimals).toString(),
      ),
      TradeType.EXACT_INPUT,
      { useQuoterV2: true },
    );

    const quoteCallReturnData = await this.provider.call({
      to: QUOTER_CONTRACT_ADDRESS,
      data: calldata,
    });

    return ethers.utils.defaultAbiCoder.decode(
      ["uint256"],
      quoteCallReturnData,
    );
  }

  async sendTransaction({
    account,
    tx,
  }: {
    account: Account;
    tx: TransactionRequest;
  }): Promise<ethers.providers.TransactionReceipt | undefined> {
    try {
      const signer = new Wallet(account.privateKey, this.provider);

      // const transaction: TransactionRequest = { ...tx };
      // const estimate = await signer.estimateGas(transaction);
      // console.log({ estimate: toReadableAmount(estimate) });
      // transaction.gasLimit = estimate.add(estimate.div(10));

      console.log("send transaction");
      const res = await signer.sendTransaction(tx);
      return res.wait();
    } catch (error) {
      throw new Error("Error sending transaction");
    }
  }
}
