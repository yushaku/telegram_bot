export const START_MESSAGE = `
What would you like to do today?
Monitor
Active Trades: 1
Disabled Trades: 0
`;

export const HELP_MESSAGE = `
👋 I am iCrypto 🤖. I am an AI bot, a crypto guru which helps identify alpha-bearing and discover token's growth potential.
All in ONE touch.

“Onchain Revolution | Social Discovery by iCrypto AI Bot“

Telegram (EN): https://t.me/onchaindatafi
Twitter (EN): https://twitter.com/onchaindatafi

----------------

✅ One Touch to Open all Token Insights

Token Report & Analysis: Discover 360 degrees of a token with insightful deep dive.

- On-chain: Details about the token you're interested in. 
You'll get insights on special wallet label's performance and activities, and also their impacts on token’s price correlation.
- Social Capture: Trend + Sentiment for any token.

✅ Insight Highlights
Extract & analyze token's on-chain notable stats

- Most Visited
- Hot Social 24H 
- Bluechip
- Accumulated 7D 
- Hot LPs

One Touch, for Alpha Signals, for Smart Traders! 🚀
`;

export const PREMIUM_MESSAGE = `
Premium: ❌

Premium Benefits ⭐
- Speed Boost: Dedicated Premium Bot 🤖
- Launch Tax/Deadblock Simulation 🕵️‍♂️
- 8   ➡️ 30 Trade Monitors
- 2   ➡️ 9 Multi-Wallets
- 3   ➡️ 10 Copytrade Wallets
- 3   ➡️ 10 Concurrent God Modes
- 1   ➡️ 5 Concurrent Presales
- Alpha Counter 🎯
- Last Seen ⌚️
- Maestro Trending List 💎
- Maestro Yacht Club Membership 💎
- First-Class Support
- Future Unrevealed Benefits

🛒 Buy for $200 per 30 days! Use the pay buttons below to start or extend your subscription.
`;

export const walletMsg = ({
  block,
  ethPrice,
  accounts,
}: {
  block: number;
  ethPrice: number;
  accounts?: { address: string; balance: number }[];
}) => `
Ethereum is supported.
Block: ${block}   ═   ETH: $${ethPrice}
💎  TogonBot | [Website](https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md) 💎
Snipe & trade at elite speeds for free.

===
${accounts
  ?.map((acc, index) => {
    return `
🏛️  [Wallet-${index}](https://etherscan.io/address/${acc.address})
💵  ${acc.balance}
🔸  ${acc.address}`;
  })
  .join("\n")} `;

export const walletDetail = ({
  block,
  ethPrice,
  balance,
}: {
  block: number;
  ethPrice: number;
  balance: number;
}) => `
⏹️  Block:  ${block} 
💠  ETH:  $${ethPrice}
💎  Wallet Balance:  $${balance}
`;

export const tokenDetail = ({
  name,
  symbol,
  address,
  decimals,
  supply,
  marketcap,
  price,
}: {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  marketcap: number;
  price: number;
}) => `
🔬  ${name} (${symbol})  -  Chain: Etherscan

Links: [Etherscan](https://etherscan.io/token/${address})  -  📈Chart
Supply: ${supply} ⬩ Decimals: ${decimals}
Marketcap: $${marketcap}
Price: $${price}
Address: ${address}

🍯 Honeypot Check: Doesnt seem like a [honeypot](https://honeypot.is/ethereum?address=${address})
`;

export const esstimateSwap = ({
  tokenA,
  tokenB,
  amountA,
  amountB,
  amountIn,
  amountOut,
  gwei,
  dollars,
  ratio,
}: {
  tokenA: string;
  tokenB: string;
  amountIn: number;
  gwei: number;
  amountA: number;
  amountB: number;
  dollars: number;
  amountOut: number;
  ratio: number;
}) => `
Estimate ${tokenA}       ➡️      ${tokenB}
You pay \`${amountIn}\` ${tokenA} in your balance: \`${amountA}\`
You receive \`${amountOut}\` ${tokenB}

---
💰 ${tokenB}'s balance from \`${amountB}\` to \`${amountB + amountOut}\`
💰 1 ${tokenB} = \`${ratio}\` ${tokenA}
---

📉 Max slipage: \`0.5%\` _auto_
💸 Fee: $\`0\`
⛽ Network cose: \`${gwei}\` GWEI = $${dollars}

---
⏲️ This transaction will expire after 1 minute
`;
