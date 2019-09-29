import fs from 'fs';
import { resolve } from 'path';
import {
  checkNetworks,
  fixDuplicates,
  parseJsonFile,
  parseTokenFiles,
  writeToDisk
} from './parser';
import { NETWORKS, RawToken } from './constants';

jest.mock('fs');

afterEach(() => {
  jest.clearAllMocks();
});

describe('checkNetworks', () => {
  it('checks for valid networks', () => {
    expect(() => checkNetworks(NETWORKS)).not.toThrow();
  });

  it('throws an error on invalid networks', () => {
    expect(() => checkNetworks(['foo', 'bar'])).toThrow();
  });
});

describe('parseJsonFile', () => {
  it('reads and parses a JSON file', async () => {
    const file = await parseJsonFile<RawToken>('foo.json');

    expect(file).toStrictEqual({
      address: '0x0',
      decimals: 18,
      symbol: 'FOO'
    });
  });

  it('throws on invalid JSON', async () => {
    await expect(parseJsonFile('invalid.json')).rejects.toThrow();
  });
});

describe('parseTokenFiles', () => {
  it('parses multiple token files', async () => {
    const tokens = await parseTokenFiles('/', []);

    expect(tokens.length).toBe(2);
    expect(tokens[0]).toStrictEqual({
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'BAR',
      decimal: 18
    });
    expect(tokens[1]).toStrictEqual({
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'BAZ',
      decimal: 18
    });
  });

  it('excludes addresses from the list', async () => {
    const tokens = await parseTokenFiles('/', ['0x0000000000000000000000000000000000000000']);

    expect(tokens.length).toBe(1);
    expect(tokens[0]).toStrictEqual({
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'BAZ',
      decimal: 18
    });
  });
});

describe('fixDuplicates', () => {
  it('changes the symbol for duplicate tokens', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        symbol: 'BAR',
        decimal: 18
      }
    ];

    const sorted = fixDuplicates(tokens);

    expect(sorted.length).toBe(4);
    expect(sorted[0]).toHaveProperty('symbol', 'FOO');
    expect(sorted[1]).toHaveProperty('symbol', 'FOO (1)');
    expect(sorted[2]).toHaveProperty('symbol', 'FOO (2)');
    expect(sorted[3]).toHaveProperty('symbol', 'BAR');
  });
});

describe('writeToDisk', () => {
  it('writes the tokens to a file', async () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        symbol: 'BAR',
        decimal: 18
      }
    ];

    const json = JSON.stringify(tokens, null, 2);

    const writeFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;

    await writeToDisk(tokens, '/', 'foo.json');
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile.mock.calls[0][0]).toBe(resolve('/', 'foo.json'));
    expect(writeFile.mock.calls[0][1]).toBe(json);
    expect(writeFile.mock.calls[0][2]).toBe('utf8');
  });
});
