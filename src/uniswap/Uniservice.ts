import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pool, Position, nearestUsableTick } from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import {
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from "@/utils/constants";
import { Account } from "utils/types";
import { getPoolInfoV3 } from "./pools";
import { getQuote } from "./quote";
import { PositionInfo } from "./types";
import { UniRoute } from "./swap";
import { Erc20Token } from "@/lib/Erc20token";

export class UniswapService extends UniRoute {
  constructor() {
    super();
  }

  async checkBalance({
    walletAddress,
    tokens,
  }: {
    walletAddress: string;
    tokens: { tokenA: Token; tokenB: Token };
  }) {
    const token1 = tokens.tokenA;
    const token2 = tokens.tokenB;

    const contractA = new Erc20Token(token1.address, this.provider);
    const contractB = new Erc20Token(token2.address, this.provider);

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
    const poolInfo = await getPoolInfoV3(
      tokenA.currency,
      tokenB.currency,
      this.provider,
    );

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

  /* async mintPosition({
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
    console.log("start");

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

    if (
      tokenInApproval === TransactionState.Failed ||
      tokenOutApproval === TransactionState.Failed
    ) {
      console.log("False");
      return "False";
    }

    const positionToMint = await this.constructPosition(
      CurrencyAmount.fromRawAmount(
        tokenA,
        fromReadableToAmount(amountA, tokenA.decimals),
      ),
      CurrencyAmount.fromRawAmount(
        tokenB,
        fromReadableToAmount(amountB, tokenB.decimals),
      ),
    );

    console.log("position", positionToMint);

    const mintOptions: MintOptions = {
      recipient: account.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
    };

    // get calldata for minting a position
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      positionToMint,
      mintOptions,
    );

    // build transaction
    const transaction: TransactionRequest = {
      from: account.address,
      to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      data: calldata,
      value: value,
    };

    console.log("transaction", transaction);

    return this.sendTransaction({ account, tx: transaction });
  } */

  async checkhash(hash: string) {
    return this.provider.getTransactionReceipt(hash);
  }
}
