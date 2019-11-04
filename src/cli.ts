import { Command } from 'commander';
import { NETWORK_NAMES, NETWORKS, VERSION } from './constants';
import { parseTokens } from './runner';

/**
 * Parse a comma separated list to an array of networks. This will return all networks if 'all' is used as value.
 *
 * @param {string} value
 * @return {string[]}
 */
export const parseNetworks = (value: string): string[] => {
  if (value === 'all') {
    return NETWORK_NAMES;
  }
  return parseArray(value);
};

/**
 * Parse a comma separated list to an array.
 *
 * @param {string} value
 * @return {string[]}
 */
export const parseArray = (value: string): string[] =>
  value.split(',').map(item => item.toLowerCase());

/**
 * Run the CLI tool with the specified args. Note that `commander` expects a `process.argv` array, where the first two
 * array items are the executable (e.g. /path/to/node) and the current working directory (e.g. /current/dir).
 *
 * @param {string[]} args
 * @return {Promise<void>}
 */
export const run = async (args: string[]): Promise<void> => {
  const program = new Command();

  program
    .name('parse-eth-tokens')
    .version(VERSION)
    .option('-o, --output <path>', 'set the output folder for the parsed tokens file(s)')
    .option(
      '--networks <networks>',
      'comma separated list of the networks to parse the tokens for',
      parseNetworks,
      ['eth']
    )
    .option(
      '-e, --exclude <addresses>',
      'comma separated list of addresses to exclude from parsing (case-insensitive)',
      parseArray,
      []
    );

  program.parse(args);

  const output: string = program.output;
  const networks: string[] = program.networks;
  const exclude: string[] = program.exclude;

  if (!output) {
    throw new Error(`error: option '-o, --output <path>' missing`);
  }

  return parseTokens({ output, networks, exclude });
};
