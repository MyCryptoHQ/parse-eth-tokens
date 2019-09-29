export const Clone = {
  clone: jest.fn().mockImplementation(() => Promise.resolve())
};

const repository = {
  fetchAll: jest.fn().mockImplementation(() => Promise.resolve()),
  mergeBranches: jest.fn().mockImplementation(() => Promise.resolve())
};

export const Repository = {
  open: jest.fn().mockImplementation(() => Promise.resolve(repository))
};
