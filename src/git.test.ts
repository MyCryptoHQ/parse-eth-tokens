import fs from 'fs';
import rimraf from 'rimraf';
import { Repository, Reset } from 'nodegit';
import { fetchRepository, updateRepository } from './git';
import { OUTPUT_PATH } from './constants';

beforeAll(callback => {
  rimraf(OUTPUT_PATH, callback);
});

afterAll(callback => {
  rimraf(OUTPUT_PATH, callback);
});

beforeEach(() => {
  jest.resetModules();
});

describe('fetchRepository', () => {
  it('fetches a repository from GitHub', async () => {
    await fetchRepository();
    expect(fs.existsSync(OUTPUT_PATH)).toBe(true);

    const repository = await Repository.open(OUTPUT_PATH);
    expect(repository.isEmpty()).toBeFalsy();
  });
});

describe('updateRepository', () => {
  it('updates an existing repository', async () => {
    await fetchRepository();

    const repository = await Repository.open(OUTPUT_PATH);
    const commit = await repository.getCommit('df19ad0040f8f4058cdd982b8a6a036c23a3bd00');
    await Reset.reset(repository, commit, Reset.TYPE.HARD, {});

    const head = await repository.getHeadCommit();
    expect(head.sha()).toBe('df19ad0040f8f4058cdd982b8a6a036c23a3bd00');

    await updateRepository();
    const newHead = await repository.getHeadCommit();
    expect(newHead.sha()).not.toBe('df19ad0040f8f4058cdd982b8a6a036c23a3bd00');
  });
});
