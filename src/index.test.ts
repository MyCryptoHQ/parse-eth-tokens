import './index';
import { run } from './cli';

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('./cli', () => ({
  run: jest.fn().mockImplementation(() => Promise.resolve())
}));

it('runs the application with passed command args', () => {
  expect(run).toHaveBeenCalledTimes(1);
  expect(run).toHaveBeenCalledWith(process.argv);
});
