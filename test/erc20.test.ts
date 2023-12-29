import { describe, expect, test } from 'bun:test';
import { Erc20Token } from 'lib/Erc20token';
import { SWAP_ROUTER_ADDRESS } from 'utils/constants';
import { UNI } from 'utils/token';

export const wallet = {
  address: '0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1',
  privateKey: '0x13d8c2dc8286cf55199a5ea81371813b1c09ae0426f4fb922611b5ab264d44f2',
};
export const wallet2 = '0xDCF14807Ca8a640aDf369655f9aD1443077bFBf2';

const amount = 10;
const uniswap = new Erc20Token(UNI.address);

describe('test function of erc20', () => {
  test('get amount', async () => {
    const res = await uniswap.getInfo(wallet.address);
    const { name, decimals, balance, symbol } = res;
    console.log({ name, decimals, balance, symbol });

    expect(decimals).toBe(UNI.decimals);
    expect(name).toBe(UNI.name);
    expect(symbol).toBe(UNI.symbol);
    expect(balance).not.toBeNil();
  });

  test('check allownce', async () => {
    const approved1 = await uniswap.allowance(wallet.address, SWAP_ROUTER_ADDRESS);

    const res = await uniswap.checkTokenApproval({
      account: wallet,
      amount: amount + approved1,
      spender: SWAP_ROUTER_ADDRESS,
    });

    expect(res.transactionHash).toBeString();
    expect(res.blockHash).toBeString();
    expect(res.to).toBe(UNI.address);
    expect(res.from).toBe(wallet.address);
  });

  test('Transfer', async () => {
    const balance1 = await uniswap.balanceOf(wallet.address);
    const balance2 = await uniswap.balanceOf(wallet2);

    await uniswap.transfer({
      to: wallet2,
      amount,
      privateKey: wallet.privateKey,
    });

    const balance11 = await uniswap.balanceOf(wallet.address);
    const balance22 = await uniswap.balanceOf(wallet2);

    expect(balance11).toBe(balance1 - amount);
    expect(balance22).toBe(balance2 + amount);
  });
});
