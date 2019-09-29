import { parseArray, parseNetworks, run } from './cli';
import { NETWORKS } from './constants';
import { parseTokens } from './parser';

jest.mock('./parser', () => ({
  parseTokens: jest.fn()
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseNetworks', () => {
  it('parses a comma separated string of networks to an array', () => {
    expect(parseNetworks('foo,bar,baz')).toStrictEqual(['foo', 'bar', 'baz']);
    expect(parseNetworks('foo')).toStrictEqual(['foo']);
    expect(parseNetworks('FOO')).toStrictEqual(['foo']);
  });

  it('parses a value of all to all networks', () => {
    expect(parseNetworks('all')).toStrictEqual(NETWORKS);
  });
});

describe('parseArray', () => {
  it('parses a comma separated string to an array', () => {
    expect(parseArray('foo,bar,baz')).toStrictEqual(['foo', 'bar', 'baz']);
    expect(parseArray('foo')).toStrictEqual(['foo']);
    expect(parseArray('FOO')).toStrictEqual(['foo']);
  });
});

describe('run', () => {
  it('runs the parser with the arguments specified', async () => {
    await run(['', '', '--output', 'foo', '--networks', 'all', '--exclude', 'foo,bar']);

    expect(parseTokens).toHaveBeenCalledTimes(1);
    expect(parseTokens).toHaveBeenCalledWith({
      output: 'foo',
      networks: NETWORKS,
      exclude: ['foo', 'bar']
    });
  });

  it('throws an error if not all required args are provided', async () => {
    await expect(run(['', '', '--networks', 'eth'])).rejects.toThrow();
  });
});
