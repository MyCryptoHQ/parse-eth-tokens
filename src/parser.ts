import fs from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';
import Listr, { ListrTask } from 'listr';
import { fetchRepository } from './git';
import { NETWORKS, OUTPUT_PATH, RawToken, Token } from './constants';
import { sortTokens, validateTokenData } from './utils';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

/**
 * Checks available networks and throws an error if the provided network does not exist.
 *
 * @param {string[]} networks
 */
export const checkNetworks = (networks: string[]) => {
  networks.forEach(network => {
    if (!NETWORKS.includes(network)) {
      throw new Error(
        `Network '${network}' is not supported. Available networks are: ${['all', ...NETWORKS].join(
          ', '
        )}`
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
    .map(({ symbol, newSymbol, address, decimal }) => ({ address, symbol: newSymbol, decimal }));
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

/**
 * Options to pass to the parser.
 */
interface ParseOptions {
  /**
   * The output directory for the parsed files.
   */
  output: string;

  /**
   * The networks to parse.
   */
  networks: string[];

  /**
   * Addresses to exclude from parsing.
   */
  exclude: string[];
}

/**
 * Fetch the token list and parse it to a file that's readable by MyCrypto.
 *
 * @param {ParseOptions} options
 * @return {Promise<void>}
 */
export const parseTokens = async (options: ParseOptions): Promise<void> => {
  const listr = new Listr<{ tokens: { [network: string]: Token[] } }>([
    {
      title: 'Fetching `ethereum-lists/tokens` repository',
      task: () => fetchRepository()
    },

    {
      title: 'Checking available networks',
      task: () => checkNetworks(options.networks)
    },

    {
      title: 'Parsing token files',
      task: () => {
        const tasks = options.networks.map<ListrTask>(network => ({
          title: network,
          task: async context => {
            context.tokens[network] = await parseTokenFiles(
              resolve(OUTPUT_PATH, 'tokens', network),
              options.exclude
            )
              .then(fixDuplicates)
              .then(sortTokens);
          }
        }));

        return new Listr(tasks);
      }
    },

    {
      title: 'Writing output file(s) to disk',
      task: context => {
        const tokens = Object.keys(context.tokens);
        const path = resolve(process.cwd(), options.output);

        const tasks = tokens.map<ListrTask>(token => ({
          title: token,
          task: nestedContext => writeToDisk(nestedContext.tokens[token], path, `${token}.json`)
        }));

        return new Listr([
          {
            title: 'Creating output folder',
            task: async (_, task) => {
              try {
                await access(path);
                task.skip('Folder already exists');
              } catch (error) {
                if (error.code !== 'ENOENT') {
                  throw new Error(`Failed to create output folder: ${error.message}`);
                }

                await mkdir(path);
              }
            }
          },
          ...tasks
        ]);
      }
    }
  ]);

  await listr.run({
    tokens: {}
  });
};
