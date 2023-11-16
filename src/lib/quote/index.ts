import { Token } from "@uniswap/sdk-core";
import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { Wallet, ethers } from "ethers";
import { getProvider } from "lib/provider";
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from "utils/token";
import { fromReadableAmount, toReadableAmount } from "utils/utils";
import { Account } from "utils/types";

export async function getQuote({
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
  const provider = getProvider();
  const signer = new Wallet(account.privateKey, provider);
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    signer,
  );

  const poolConstants = await getPoolConstants({ tokenA, tokenB });
  console.log(poolConstants);

  const quotedAmountOut = await quoterContract.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(amount, tokenA.decimals).toString(),
    0,
  );

  return toReadableAmount(quotedAmountOut, tokenB.decimals);
}

async function getPoolConstants({
  tokenA,
  tokenB,
}: {
  tokenA: Token;
  tokenB: Token;
}) {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA,
    tokenB,
    fee: FeeAmount.MEDIUM,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider(),
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
