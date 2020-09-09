import { basename } from 'path';

export const promises = {
  async readdir() {
    return ['bar.json', 'baz.json'];
  },

  async readFile(path: string) {
    const file = basename(path);

    // Few different test cases
    let data;
    switch (file) {
      case 'foo.json':
        data = {
          address: '0x0',
          decimals: 18,
          symbol: 'FOO',
          name: 'Foo'
        };
        break;
      case 'bar.json':
        data = {
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'BAR',
          name: 'Bar'
        };
        break;
      case 'baz.json':
        data = {
          address: '0x0000000000000000000000000000000000000001',
          decimals: 18,
          symbol: 'BAZ',
          name: 'Baz'
        };
        break;
      case 'invalid.json':
        return 'I am invalid JSON';
    }

    return JSON.stringify(data);
  },

  writeFile: jest.fn().mockImplementation(() => Promise.resolve()),

  mkdir: jest.fn().mockImplementation(() => Promise.resolve()),

  access: jest.fn().mockImplementation(async () => {
    const error = new Error() as NodeJS.ErrnoException;
    error.code = 'ENOENT';

    throw error;
  })
};
