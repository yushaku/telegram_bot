# Elysia with Bun runtime

## Getting Started

To get started with this template, simply paste this command into your terminal:

```bash
bun create elysia ./elysia-example
```

## Development

To start the development server run:

```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## hightlevel design

```mermaid
flowchart TB
1(user) ----> 2(telegram)
2 ---->3(bot)

subgraph telegram
3 <----> 4(uniswap)
3 <----> 5(1inch)
3 <----> 6(redis for cache)
end
```

