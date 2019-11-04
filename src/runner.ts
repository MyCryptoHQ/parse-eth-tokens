import { resolve } from 'path';
import Listr, { ListrTask } from 'listr';
import { fetchRepository } from './git';
import {
  addUniqueId,
  checkNetworks,
  createOutputFolder,
  fixDuplicates,
  parseTokenFiles,
  sortTokens,
  writeToDisk
} from './parser';
import { NETWORKS, OUTPUT_PATH, Token } from './constants';

/**
 * Options to pass to the parser.
 */
export interface ParseOptions {
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
            const chainId = NETWORKS.find(n => n.name === network)!.chainId;

            context.tokens[network] = await parseTokenFiles(
              resolve(OUTPUT_PATH, 'tokens', network),
              options.exclude
            )
              .then(tokens => addUniqueId(tokens, chainId))
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
            task: () => createOutputFolder(path)
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
