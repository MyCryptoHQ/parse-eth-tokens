import { promises as fs } from 'fs';
import { REPO_URL, OUTPUT_PATH } from './constants';
import simpleGit from 'simple-git';

/**
 * Update the master branch of an existing Git repo.
 *
 * @return {Promise<void>>}
 */
export const updateRepository = async (): Promise<void> => {
  const git = simpleGit(OUTPUT_PATH);
  await git.pull();
};

/**
 * Fetch a Git repository and return the file system path of the folder containing the repository.
 *
 * @return {Promise<string>}
 */
export const fetchRepository = async (): Promise<void> => {
  try {
    await fs.access(OUTPUT_PATH);
    await updateRepository();
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }

    await fs.mkdir(OUTPUT_PATH, { recursive: true });
    const git = simpleGit(OUTPUT_PATH);
    await git.clone(REPO_URL, OUTPUT_PATH);
  }
};
