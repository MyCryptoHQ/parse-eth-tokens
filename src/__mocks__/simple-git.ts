export default jest.fn(() => {
  return {
    clone: jest.fn(),
    pull: jest.fn()
  };
});
