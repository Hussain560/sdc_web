// Conventional Commits (docs/07-engineering/versioning-and-releases.md)
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
  },
};
