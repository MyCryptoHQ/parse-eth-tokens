import fs from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';
import mkdirp from 'mkdirp';
import getUuidByString from 'uuid-by-string';
import { NETWORK_NAMES, RawToken, Token, TOKEN_SCHEMA } from './constants';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

/**
 * Checks available networks and throws an error if the provided network does not exist.
 *
 * @param {string[]} networks
 */
export const checkNetworks = (networks: string[]) => {
  networks.forEach(network => {
    if (!NETWORK_NAMES.includes(network)) {
      throw new Error(
        `Network '${network}' is not supported. Available networks are: ${[
          'all',
          ...NETWORK_NAMES
        ].join(', ')}`
      );
    }
  });
};

/**
 * Reads and parses a JSON file. Throws an error if the file could not be read or if the JSON is invalid.
 *
 * @param {string} file
 * @return {Promise<T>}
 * @template T
 */
export const parseJsonFile = async <T>(file: string): Promise<T> => {
  try {
    const json = await readFile(file, 'utf8');
    return JSON.parse(json);
  } catch (error) {
    throw new Error(`Failed to parse file ${file}: ${error.message}`);
  }
};

/**
 * Validate raw token data, by checking if the required values are set and if the decimals are larger than or equal to
 * zero. This will strip any unknown fields and rename the 'decimals' field to 'decimal' for compatibility.
 *
 * @param {RawToken} token
 * @return {boolean}
 */
export const validateTokenData = (token: RawToken): Token => {
  const result = TOKEN_SCHEMA.validate(token);

  if (result.error) {
    throw new Error(`Invalid JSON schema for token ${token.address}: ${result.error.message}`);
  }

  return result.value as Token;
};

/**
 * Gets all token files from the file system, parses and validates them, fixes any duplicates and sorts them by symbol.
 *
 * @param {string} path
 * @param {string[]} exclude
 * @return {Promise<Token[]>}
 */
export const parseTokenFiles = async (path: string, exclude: string[]): Promise<Token[]> => {
  const files = await readdir(path);

  return files.reduce<Promise<Token[]>>(async (tokens, file) => {
    const tokenData = await parseJsonFile<RawToken>(resolve(path, file));
    const token = validateTokenData(tokenData);

    if (exclude.includes(token.address.toLowerCase())) {
      return tokens;
    }

    return Promise.resolve([...(await tokens), token]);
  }, Promise.resolve([]));
};

/**
 * Add a unique ID (UUID) to each token. This uses name-based UUIDs and is deterministic, based on
 * the chain ID and token address.
 *
 * @param {Token[]} tokens
 * @param {number} chainId
 * @return {Token[]}
 */
export const addUniqueId = (tokens: Token[], chainId: number): Token[] => {
  return tokens.map(token => ({
    ...token,
    uuid: getUuidByString(`${chainId}-${token.symbol}`)
  }));
};

/**
 * Finds duplicate tokens and changes the symbols for the duplicates.
 *
 * @param {Token[]} tokens
 * @return {Token[]}
 */
export const fixDuplicates = (tokens: Token[]): Token[] => {
  return tokens
    .reduce<(Token & { newSymbol: string })[]>((checkedTokens, token) => {
      const duplicates = checkedTokens.filter(checkedToken => checkedToken.symbol === token.symbol);
      const newToken: Token & { newSymbol: string } = {
        ...token,
        newSymbol: token.symbol
      };

      if (duplicates.length > 0) {
        newToken.newSymbol = `${token.symbol} (${duplicates.length})`;
      }

      return [...checkedTokens, newToken];
    }, [])
    .map(({ symbol, newSymbol, address, ...rest }) => ({ address, symbol: newSymbol, ...rest }));
};

/**
 * Sort tokens alphabetically by symbol.
 *
 * @param {Token[]} tokens
 * @return {Token[]}
 */
export const sortTokens = (tokens: Token[]): Token[] => {
  return tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
};

/**
 * Creates the output folder if it does not exist yet.
 *
 * @param {string} path
 * @return {Promise<void>}
 */
export const createOutputFolder = async (path: string): Promise<void> => {
  try {
    await access(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Failed to create output folder: ${error.message}`);
    }

    mkdirp.sync(path);
  }
};

/**
 * Write the resulting token array to a file on the disk. This assumes that the output path specified exists, and is a
 * folder.
 *
 * @param {Token[]} tokens
 * @param {string} path
 * @param {string} name
 * @return {Promise<void>}
 */
export const writeToDisk = async (tokens: Token[], path: string, name: string): Promise<void> => {
  const json = JSON.stringify(tokens, null, 2);
  return writeFile(resolve(path, name), json, 'utf8');
};
