import fs from 'fs';
import { Clone, Repository } from 'nodegit';
import { fetchRepository, updateRepository } from './git';
import { OUTPUT_PATH, REPO_URL } from './constants';

jest.mock('fs');
jest.mock('nodegit');

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

    expect(Clone.clone).toBeCalledTimes(1);
    expect(Clone.clone).toBeCalledWith(REPO_URL, OUTPUT_PATH);
  });

  it('updates a local repository if it already exists', async () => {
    const access = fs.access as jest.MockedFunction<typeof fs.access>;
    access.mockImplementationOnce((path: fs.PathLike, callback: (error: Error | null) => void) => {
      callback(null);
    });

    await expect(fetchRepository()).resolves.toBeUndefined();

    expect(Repository.open).toBeCalledTimes(1);
    expect(Repository.open).toBeCalledWith(OUTPUT_PATH);
  });

  it('throws an error if the error code is not ENOENT', async () => {
    const access = fs.access as jest.MockedFunction<typeof fs.access>;
    access.mockImplementationOnce((path: fs.PathLike, callback: (error: Error | null) => void) => {
      const error = new Error() as NodeJS.ErrnoException;
      error.code = 'EFOO';

      callback(error);
    });

    await expect(fetchRepository()).rejects.toThrow();
  });
});

describe('updateRepository', () => {
  it('updates an existing repository', async () => {
    await expect(updateRepository()).resolves.toBeUndefined();

    const open = Repository.open as jest.MockedFunction<typeof Repository.open>;

    expect(open).toBeCalledTimes(1);
    expect(open).toBeCalledWith(OUTPUT_PATH);

    const repository = await open.mock.results[0].value;

    expect(repository.fetchAll).toHaveBeenCalledTimes(1);
    expect(repository.mergeBranches).toHaveBeenCalledTimes(1);
    expect(repository.mergeBranches).toHaveBeenCalledWith('master', 'origin/master');
  });
});
