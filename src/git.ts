import fs from 'fs';
import { promisify } from 'util';
import { Clone, Repository } from 'nodegit';
import { REPO_URL, OUTPUT_PATH } from './constants';

const access = promisify(fs.access);

/**
 * Update the master branch of an existing Git repo.
 *
 * @return {Promise<void>>}
 */
export const updateRepository = async (): Promise<void> => {
  const repository = await Repository.open(OUTPUT_PATH);
  await repository.fetchAll();
  await repository.mergeBranches('master', 'origin/master');
};

/**
 * Fetch a Git repository and return the file system path of the folder containing the repository.
 *
 * @return {Promise<string>}
 */
export const fetchRepository = async (): Promise<void> => {
  try {
    await access(OUTPUT_PATH);
    await updateRepository();
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }

    await Clone.clone(REPO_URL, OUTPUT_PATH);
  }
};
