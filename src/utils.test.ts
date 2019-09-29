import { sortTokens, validateTokenData } from './utils';

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

describe('sortTokens', () => {
  it('sorts tokens alphabetically based on the symbol', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'FOO'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'BAR'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'BAZ'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        decimal: 18,
        symbol: 'QUX'
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
