# EVM Wallet Lens

A lightweight browser tool for inspecting native balances, transaction counts and ERC-20 token balances on EVM networks. Built with plain HTML, CSS and JavaScript in one file.

**[Try the live demo](https://shelbygrayman.github.io/evm-wallet-lens/)** · [Report a bug or suggest a feature](https://github.com/shelbygrayman/evm-wallet-lens/issues)

## What it does

- Supports Ethereum, Base and Arbitrum, plus a custom EVM RPC URL.
- Reads native balances, chain ID and transactions sent.
- Looks up multiple ERC-20 contracts at once: separate their addresses with commas.
- Reads token balances, decimals and symbols through JSON-RPC.
- Retries failed Ethereum and Base requests using a backup endpoint.
- Runs without a build step, package installation or wallet connection.

## Quick start

1. Open the live demo.
2. Choose a network and check the RPC URL.
3. Paste a public wallet address (`0x` followed by 40 hexadecimal characters).
4. Optionally enter ERC-20 contract addresses on the same network, separated by commas.
5. Select **Look up**.

To run locally, download this repository and open `index.html` in a modern browser. The browser must be able to reach the selected RPC endpoint.

## How it works

| Data | JSON-RPC method |
| --- | --- |
| Network identifier | `eth_chainId` |
| Native balance | `eth_getBalance` |
| Transactions sent (account nonce) | `eth_getTransactionCount` |
| ERC-20 balance and metadata | `eth_call` |

Token calls use manual ABI encoding and decoding. Each token lookup handles its own errors so one failed token does not discard the others.

## Privacy and limitations

- No seed phrase, private key or transaction signature is needed. Queries go directly from your browser to the selected RPC provider; that provider can see the queried addresses and your connection information.
- Public RPC endpoints may rate-limit requests or reject browser requests. Try another compatible endpoint if a lookup fails.
- Transactions sent is the account nonce, not a complete history of incoming transfers or contract activity.
- Token contracts must belong to the selected network. Nonstandard metadata may fail to decode.
- Balances are displayed with up to six decimal places, truncated rather than rounded. Very small balances can display as zero.
- This tool does not discover all tokens, calculate portfolio prices or display transfer history.

## Contributing

Small, focused improvements are welcome. For a bug report, include the network, steps to reproduce, expected result and actual result. Share public example addresses only when you are comfortable making them public; never include credentials or private RPC keys.

For a change, open a pull request explaining the behavior and how you checked it. Keep the app dependency-free and easy to run.

## Roadmap

- [x] Multiple token lookups at once
- [x] Backup RPC endpoints for Ethereum and Base
- [ ] Recent transfer history
- [ ] More network presets after verifying public RPC details
- [ ] Better token metadata compatibility and small-balance display

## License

MIT
