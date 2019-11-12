# parse-eth-tokens

[![npm](https://img.shields.io/npm/v/parse-eth-tokens)](https://www.npmjs.com/package/parse-eth-tokens)
[![codecov](https://codecov.io/gh/MyCryptoHQ/parse-eth-tokens/branch/master/graph/badge.svg)](https://codecov.io/gh/MyCryptoHQ/parse-eth-tokens)
[![Travis](https://travis-ci.com/MyCryptoHQ/parse-eth-tokens.svg?branch=master)](https://travis-ci.com/MyCryptoHQ/parse-eth-tokens)

This is a simple CLI tool to parse the [`ethereum-lists/tokens`](https://github.com/ethereum-lists/tokens) repository to a format that is used by MyCrypto. The tool pulls the repository from GitHub and outputs the parsed JSON file(s).

## Installation

You can install the tool with `yarn` or `npm`:

```
$ yarn global add parse-eth-tokens
```
or
```
$ npm install -g parse-eth-tokens
```

Then, simply use `parse-eth-tokens` in a terminal to use it.

## CLI

```
Usage: parse-eth-tokens [options]

Options:
  -V, --version              output the version number
  -o, --output <path>        output folder for the parsed tokens file(s)
  --networks <networks>      comma separated list of the networks to parse the tokens for (default: ["eth"])
  -e, --exclude <addresses>  comma separated list of addresses to exclude from parsing (case-insensitive) (default: [])
  -h, --help                 output usage information
```

### Examples

#### Parse all available networks

```
$ parse-eth-tokens --networks all --output ./output
```

#### Parse ETH and ETC network and exclude a few addresses

```
$ parse-eth-tokens --networks eth,etc --exclude 0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359,0xa74476443119A942dE498590Fe1f2454d7D4aC0d --output ./output
```

## Supported networks

All networks defined in [`ethereum-lists/tokens`](https://github.com/ethereum-lists/tokens) are supported. Currently, those are:

* Ellaism (ella)
* Ethersocial (esn)
* Ethereum Classic (etc)
* Ethereum (eth)
* Görli (gor)
* Kovan (kov)
* Rinkeby (rin)
* Ropsten (rop)
* Ubiq (ubq)

The networks can be set using the `--networks` option. To parse the tokens for all networks, use `--networks all`.

## Development

You can install dependencies with yarn:

```
yarn
```

To run the automated tests, use:

```
yarn test
```

To test the CLI, use:

```
yarn prepare && node lib
```
