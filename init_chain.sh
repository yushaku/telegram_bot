#!/bin/sh

if [[ ! -f .env ]]; then
	cat .env.example >.env
fi

while read line; do
	name=$(echo $line | cut -d= -f1)
	value=$(echo $line | cut -d= -f2 | sed 's/"//g')
	chain='mainnet'

	if [ "$name" = "NODE_ENV" ]; then
		if [ $value = "LOCAL" ]; then
			chain='mainnet'
		elif [ $value = "GOERLI" ]; then
			chain='goerli'
		elif [ $value = "SEPOLIA" ]; then
			chain='sepolia'
		fi
	fi

	if [ "$name" = "INFURA_KEY" ]; then
		pnpm ganache-cli --fork https://$chain.infura.io/v3/$value \
			--account="0x82387ef67b43b3381bcb066c1a810fd2617f8d5498aeeab1ceea08ca6dca1d55,100000000000000000000000000" \
			--account="0x13d8c2dc8286cf55199a5ea81371813b1c09ae0426f4fb922611b5ab264d44f2,100000000000000000000000000"
	fi
done <".env"
