import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, protocols } from './../utils/constants';
import { BigNumber, Contract, Wallet, ethers } from 'ethers';
import JSBI from 'jsbi';
import ERC20_ABI from '../abis/erc20.json';
import { fromReadableAmount, fromReadableToAmount, toReadableAmount } from '../utils/utils';
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import {
  SwapRoute,
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
  SwapOptions,
} from '@uniswap/smart-order-router';
import {
  Pool,
  Route,
  Trade,
  SwapRouter,
  SwapQuoter,
  MintOptions,
  NonfungiblePositionManager,
  Position,
  nearestUsableTick,
  FeeAmount,
} from '@uniswap/v3-sdk';
import { TransactionRequest } from '@ethersproject/providers';
import { getQuote } from './quote';
import { getPoolInfoV3 } from './pools';
import { getProvider } from 'utils/networks';
import {
  V2_SWAP_ROUTER_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
} from 'utils/constants';
import { chainId } from 'utils/token';
import { Account } from 'utils/types';
import { TransactionState, PositionInfo } from './types';

export class UniswapService {
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = getProvider();
  }

  async checkBalance({
    walletAddress,
    tokens,
  }: {
    walletAddress: string;
    tokens: { tokenA: Token; tokenB: Token };
  }) {
    const [tokenA, tokenB] = await Promise.all([
      this.getTokenInfo({
        walletAddress,
        tokenAddress: tokens.tokenA.address,
      }),
      this.getTokenInfo({
        walletAddress,
        tokenAddress: tokens.tokenB.address,
      }),
    ]);

    return { tokenA, tokenB };
  }

  async getTokenInfo({ tokenAddress, walletAddress }: { tokenAddress: string; walletAddress?: string }) {
    const contractERC20 = new Contract(tokenAddress, ERC20_ABI, this.provider);

    const [balance, decimals, name, symbol] = await Promise.all([
      walletAddress ? contractERC20.balanceOf(walletAddress) : 0,
      contractERC20.decimals(),
      contractERC20.name(),
      contractERC20.symbol(),
    ]);

    return {
      balance: toReadableAmount(balance, decimals),
      decimals,
      name,
      symbol,
    };
  }

  async generateRoute({
    walletAddress,
    tokenA,
    tokenB,
    amount,
  }: {
    walletAddress: string;
    tokenA: Token;
    tokenB: Token;
    amount: number;
  }): Promise<SwapRoute | null> {
    const router = new AlphaRouter({
      chainId,
      provider: this.provider,
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: walletAddress,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 30 * 60), // 1800 seconds – 30 mins deadline
      type: SwapType.SWAP_ROUTER_02,
    };

    const amountIn = CurrencyAmount.fromRawAmount(
      tokenA,
      fromReadableToAmount(amount, tokenA.decimals).toString(),
    );

    const route = await router.route(amountIn, tokenB, TradeType.EXACT_INPUT, options);

    return route;
  }

  async executeRoute({ route, account }: { route: SwapRoute; account: Account }) {
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
      return 'Buy token failed';
    }
  }

  async sendTransaction({ account, tx }: { account: Account; tx: TransactionRequest }) {
    try {
      const wallet = new Wallet(account.privateKey, this.provider);
      const [nonce, gasLimit, gasPrice] = await Promise.all([
        wallet.getTransactionCount(),
        this.provider.getBlock('latest').then((data) => data.gasLimit),
        this.provider.getGasPrice(),
      ]);

      console.log(nonce, gasLimit, gasPrice);

      const transaction: TransactionRequest = {
        ...tx,
        nonce: nonce + 2,
        gasLimit,
        gasPrice,
      };

      // const estimate = await signer.estimateGas(transaction);
      // console.log({ estimate: toReadableAmount(estimate) });

      const signedTransaction = await wallet.signTransaction(transaction);
      // transaction.gasLimit = estimate.add(estimate.div(10));
      console.log('send transaction');
      return await wallet.sendTransaction(transaction);
      // let receipt = null;

      // while (receipt === null) {
      //   try {
      //     receipt = await this.provider.getTransactionReceipt(txRes.hash);

      //     if (receipt === null) {
      //       console.log({ receipt, tx: txRes.hash });
      //       continue;
      //     }
      //   } catch (e) {
      //     console.log(`Receipt error:`, e);
      //     break;
      //   }
      // }
    } catch (error) {
      console.log(error);
      return 'Buy token failed';
    }
  }

  async checkTokenApproval({
    token,
    account,
    amount,
    contractAddress = V2_SWAP_ROUTER_ADDRESS,
  }: {
    token: Token;
    amount: number;
    account: Account;
    contractAddress?: string;
  }) {
    try {
      const signer = new Wallet(account.privateKey, this.provider);
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);

      const allowedAmount = await tokenContract.allowance(account.address, contractAddress);

      console.log(`Allowed amount: ${toReadableAmount(allowedAmount)}`);

      if (allowedAmount >= amount) return 'Ok';
      const hexAmount = fromReadableToAmount(amount, token.decimals).toString();

      const transaction = await tokenContract.approve(contractAddress, hexAmount);

      await transaction.wait();
      return 'Ok';
    } catch (error) {
      console.error(error);
      return TransactionState.Failed;
    }
  }

  async createTrade({
    tokenA,
    tokenB,
    amount,
    poolFee = FeeAmount.MEDIUM,
  }: {
    tokenA: Token;
    tokenB: Token;
    amount: number;
    poolFee?: number;
  }) {
    const poolInfo = await getPoolInfoV3(tokenA, tokenB);
    const pool = new Pool(
      tokenA,
      tokenB,
      poolFee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick,
    );

    const route = new Route([pool], tokenA, tokenB);
    console.log(route);
    console.log('get output quote');
    const amountOut = await this.getOutputQuote({
      token: tokenA,
      route,
      amount,
    });

    console.log({ route, amountOut });

    const uncheckedTrade = Trade.createUncheckedTrade({
      route,
      inputAmount: CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableAmount(amount, tokenA.decimals).toString(),
      ),
      outputAmount: CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(amountOut)),
      tradeType: TradeType.EXACT_INPUT,
    });

    return uncheckedTrade;
  }

  async executeTrade({ trade, account }: { trade: Trade<Currency, Currency, TradeType>; account: Account }) {
    const options: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      recipient: account.address,
    };

    const methodParameters = SwapRouter.swapCallParameters([trade], options);

    const tx = {
      from: account.address,
      to: SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      data: methodParameters.calldata,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    };

    return this.sendTransaction({ account, tx });
  }

  async getOutputQuote({
    route,
    token,
    amount,
  }: {
    route: Route<Currency, Currency>;
    token: Token;
    amount: number;
  }) {
    const { calldata } = SwapQuoter.quoteCallParameters(
      route,
      CurrencyAmount.fromRawAmount(token, fromReadableAmount(amount, token.decimals).toString()),
      TradeType.EXACT_INPUT,
      { useQuoterV2: true },
    );

    const data = await this.provider.call({
      to: QUOTER_CONTRACT_ADDRESS,
      data: calldata,
    });

    console.log({ data });
    return ethers.utils.defaultAbiCoder.decode(['uint256'], data);
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
    const result = await getQuote({ tokenA, tokenB, amount, account });
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
      const tokenOfOwnerByIndex: number = await positionContract.tokenOfOwnerByIndex(address, i);
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

  async constructPosition(tokenA: CurrencyAmount<Token>, tokenB: CurrencyAmount<Token>): Promise<Position> {
    // get pool info
    const poolInfo = await getPoolInfoV3(tokenA.currency, tokenB.currency);

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
      tickLower: nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) - poolInfo.tickSpacing * 2,
      tickUpper: nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) + poolInfo.tickSpacing * 2,
      amount0: tokenA.quotient,
      amount1: tokenB.quotient,
      useFullPrecision: true,
    });
  }

  async mintPosition({
    tokenA,
    tokenB,
    account,
    amountA,
    amountB,
  }: {
    tokenA: Token;
    tokenB: Token;
    account: Account;
    amountA: number;
    amountB: number;
  }) {
    console.log('start');

    const [tokenInApproval, tokenOutApproval] = await Promise.all([
      this.checkTokenApproval({
        contractAddress: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        amount: amountA,
        token: tokenA,
        account,
      }),
      this.checkTokenApproval({
        contractAddress: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        amount: amountB,
        token: tokenB,
        account,
      }),
    ]);

    if (tokenInApproval === TransactionState.Failed || tokenOutApproval === TransactionState.Failed) {
      console.log('False');
      return 'False';
    }

    const positionToMint = await this.constructPosition(
      CurrencyAmount.fromRawAmount(tokenA, fromReadableToAmount(amountA, tokenA.decimals)),
      CurrencyAmount.fromRawAmount(tokenB, fromReadableToAmount(amountB, tokenB.decimals)),
    );

    console.log('position', positionToMint);

    const mintOptions: MintOptions = {
      recipient: account.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
    };

    // get calldata for minting a position
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(positionToMint, mintOptions);

    // build transaction
    const transaction: TransactionRequest = {
      from: account.address,
      to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      data: calldata,
      value: value,
    };

    console.log('transaction', transaction);

    return this.sendTransaction({ account, tx: transaction });
  }

  async checkhash(hash: string) {
    return this.provider.getTransactionReceipt(hash);
  }
}
