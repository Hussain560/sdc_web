// Conventional Commits (docs/07-engineering/git-workflow.md §3).
// `release` and `deploy` are allowed for the PR titles of the release cycle ("release: v1.2.0", "deploy: v1.2.0").
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'deploy',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'release',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
