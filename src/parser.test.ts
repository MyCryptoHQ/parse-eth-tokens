import fs from 'fs';
import { resolve } from 'path';
import mkdirp from 'mkdirp';
import {
  addUniqueId,
  checkNetworks,
  createOutputFolder,
  fixDuplicates,
  parseJsonFile,
  parseTokenFiles,
  sortTokens,
  validateTokenData,
  writeToDisk
} from './parser';
import { NETWORK_NAMES, RawToken, Token } from './constants';

jest.mock('fs');

afterEach(() => {
  jest.clearAllMocks();
});

describe('checkNetworks', () => {
  it('checks for valid networks', () => {
    expect(() => checkNetworks(NETWORK_NAMES)).not.toThrow();
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

describe('validateTokenData', () => {
  it('strips unknown fields', () => {
    const token = {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'FOO',
      foo: 'bar'
    };

    expect(validateTokenData(token)).not.toHaveProperty('foo', 'bar');
  });

  it('renames the decimals field to decimal', () => {
    const token = {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'FOO'
    };

    expect(validateTokenData(token)).toHaveProperty(
      'address',
      '0x0000000000000000000000000000000000000000'
    );
    expect(validateTokenData(token)).toHaveProperty('decimal', 18);
    expect(validateTokenData(token)).toHaveProperty('symbol', 'FOO');
  });

  it('throws an error on invalid input', () => {
    expect(() => validateTokenData({})).toThrow();
    expect(() =>
      validateTokenData({
        address: '0x0',
        decimals: 18,
        symbol: 'FOO'
      })
    ).toThrow();
    expect(() =>
      validateTokenData({
        address: '0x0000000000000000000000000000000000000000',
        decimals: -1,
        symbol: 'FOO'
      })
    ).toThrow();
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

describe('addUniqueId', () => {
  it('adds a deterministic unique ID to tokens', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'FOO',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'BAR',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        symbol: 'BAZ',
        decimal: 18
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        symbol: 'QUX',
        decimal: 18
      }
    ];

    expect(addUniqueId(tokens as Token[], 1)).toMatchSnapshot();
    expect(addUniqueId(tokens as Token[], 2)).toMatchSnapshot();
  });
});

describe('fixDuplicates', () => {
  it('changes the symbol for duplicate tokens', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        symbol: 'BAR',
        decimal: 18,
        uuid: ''
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

describe('sortTokens', () => {
  it('sorts tokens alphabetically based on the symbol', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'FOO',
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'BAR',
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'BAZ',
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'QUX',
        uuid: ''
      }
    ];

    const sorted = sortTokens(tokens);

    expect(sorted).toHaveLength(4);
    expect(sorted[0]).toHaveProperty('symbol', 'BAR');
    expect(sorted[1]).toHaveProperty('symbol', 'BAZ');
    expect(sorted[2]).toHaveProperty('symbol', 'FOO');
    expect(sorted[3]).toHaveProperty('symbol', 'QUX');
  });
});

describe('createOutputFolder', () => {
  it('creates the output foldder', async () => {
    await expect(createOutputFolder('foo')).resolves.toBeUndefined();

    const mkdir = mkdirp.sync as jest.MockedFunction<typeof mkdirp.sync>;

    expect(mkdir.mock.calls[0][0]).toBe('foo');
  });

  it('throws an error if the error code is not ENOENT', async () => {
    const access = fs.access as jest.MockedFunction<typeof fs.access>;
    access.mockImplementationOnce((path: fs.PathLike, callback: (error: Error | null) => void) => {
      const error = new Error() as NodeJS.ErrnoException;
      error.code = 'EFOO';

      callback(error);
    });

    await expect(createOutputFolder('foo')).rejects.toThrow();
  });
});

describe('writeToDisk', () => {
  it('writes the tokens to a file', async () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        symbol: 'FOO',
        decimal: 18,
        uuid: ''
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        symbol: 'BAR',
        decimal: 18,
        uuid: ''
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
