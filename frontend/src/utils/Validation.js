export const isValidBugIdFormat = (bugId) => {
  return /^BUG-\d+$/.test(bugId);
};
