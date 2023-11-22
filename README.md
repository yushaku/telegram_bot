# telegram bot - Bun runtime

## Development

```bash
# To start the development server run:
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## hightlevel design

```mermaid
flowchart TB
1(user) ----> 2(telegram)
2 <--message-->3(bot server)

subgraph backend
3 <----> 4(uniswap) --> 4.1(universal router) --> 4.2(v2/v3 pools)
3 <----> 5(1inch)
3 <--cache--> 6(redis for cache)
6 --get--> 7(mongo)
3 --write-->7
end
```
