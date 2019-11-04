import { ParseOptions, parseTokens } from './runner';
import {
  addUniqueId,
  checkNetworks,
  createOutputFolder,
  fixDuplicates,
  parseTokenFiles,
  sortTokens,
  writeToDisk
} from './parser';

jest.mock('listr');
jest.mock('./git', () => ({
  fetchRepository: jest.fn().mockImplementation(() => Promise.resolve())
}));
jest.mock('./parser', () => ({
  checkNetworks: jest.fn(),
  parseTokenFiles: jest.fn().mockImplementation(() => Promise.resolve()),
  addUniqueId: jest.fn().mockImplementation(tokens => tokens),
  fixDuplicates: jest.fn().mockImplementation(tokens => tokens),
  sortTokens: jest.fn().mockImplementation(tokens => tokens),
  createOutputFolder: jest.fn().mockImplementation(() => Promise.resolve()),
  writeToDisk: jest.fn().mockImplementation(() => Promise.resolve())
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseTokens', () => {
  it('parses tokens based on the provided options', async () => {
    const options: ParseOptions = {
      output: './foo',
      networks: ['eth'],
      exclude: []
    };

    await expect(parseTokens(options)).resolves.toBeUndefined();
    expect(checkNetworks).toHaveBeenCalledTimes(1);
    expect(parseTokenFiles).toHaveBeenCalledTimes(1);
    expect(addUniqueId).toHaveBeenCalledTimes(1);
    expect(fixDuplicates).toHaveBeenCalledTimes(1);
    expect(sortTokens).toHaveBeenCalledTimes(1);
    expect(createOutputFolder).toHaveBeenCalledTimes(1);
    expect(writeToDisk).toHaveBeenCalledTimes(1);
  });

  it('parses tokens based on the provided options for multiple networks', async () => {
    const options: ParseOptions = {
      output: './foo',
      networks: ['eth', 'etc'],
      exclude: []
    };

    await expect(parseTokens(options)).resolves.toBeUndefined();
    expect(checkNetworks).toHaveBeenCalledTimes(1);
    expect(parseTokenFiles).toHaveBeenCalledTimes(2);
    expect(addUniqueId).toHaveBeenCalledTimes(2);
    expect(fixDuplicates).toHaveBeenCalledTimes(2);
    expect(sortTokens).toHaveBeenCalledTimes(2);
    expect(createOutputFolder).toHaveBeenCalledTimes(1);
    expect(writeToDisk).toHaveBeenCalledTimes(2);
  });
});
