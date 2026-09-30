# EVM Wallet Lens

A lightweight, zero-dependency web tool to inspect any wallet on EVM chains (Ethereum, Base, Arbitrum, or any custom RPC).

## Features
- Native balance and transaction count via raw JSON-RPC (`eth_getBalance`, `eth_getTransactionCount`)
- ERC-20 token balance, decimals and symbol via `eth_call` with manual ABI encoding/decoding
- Works with any EVM chain: pick "Custom" and paste an RPC URL
- Single HTML file, no build step, no libraries

## Run it
Open `index.html` in a browser, or view the live version on GitHub Pages.

## Roadmap
- [ ] Multiple token lookups at once
- [ ] Recent transfer history
- [ ] Add more chains (e.g. Robinhood Chain once public RPC details are confirmed)

## License
MIT
