# Telegram Bot Trading

Welcome to my telegram bot trading.
![video start](./public/tradingCat.jpeg)

## Hightlevel Design

```mermaid
flowchart LR
1(User) ----> 2(Telegram)
2 <--Message-->3(bot server)

subgraph backend
3 <--swap--> 4(uniswap)
3 <--cache--> 6(redis for cache)
6 --get--> 7(mongo)
3 --write-->7
end
```

## Video demo

### start and mamager wallet

![video start](./public/start.mp4)

<video width="320" height="240" controls>
  <source src="./public/start.mp4" type="video/mp4">
</video>
