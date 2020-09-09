import { promises as fs } from 'fs';
import { fetchRepository } from './git';
import { OUTPUT_PATH } from './constants';

jest.mock('fs');
jest.mock('simple-git');

afterEach(() => {
  jest.clearAllMocks();
});

describe('fetchRepository', () => {
  it('checks if a repository already exists locally', async () => {
    await expect(fetchRepository()).resolves.toBeUndefined();

    const access = fs.access as jest.MockedFunction<typeof fs.access>;

    expect(access).toBeCalledTimes(1);
    expect(access.mock.calls[0][0]).toBe(OUTPUT_PATH);
  });

  it('fetches a repository from GitHub', async () => {
    await expect(fetchRepository()).resolves.toBeUndefined();
  });

  it('updates a local repository if it already exists', async () => {
    const access = fs.access as jest.MockedFunction<typeof fs.access>;
    access.mockImplementationOnce(() => Promise.resolve());

    await expect(fetchRepository()).resolves.toBeUndefined();
  });

  it('throws an error if the error code is not ENOENT', async () => {
    const access = fs.access as jest.MockedFunction<typeof fs.access>;
    access.mockImplementationOnce(async () => {
      const error = new Error() as NodeJS.ErrnoException;
      error.code = 'EFOO';

      throw error;
    });

    await expect(fetchRepository()).rejects.toThrow();
  });
});
