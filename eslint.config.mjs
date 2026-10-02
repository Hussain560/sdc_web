import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Playwright fixtures call `use()`, which is not a React hook.
  { files: ['tests/e2e/**'], rules: { 'react-hooks/rules-of-hooks': 'off' } },
  // D-009: new UI code uses semantic tokens (var(--accent), bg-surface), never raw hex colours.
  {
    files: [
      'src/modules/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'app/**/dashboard/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            'No raw hex colours � use semantic tokens (docs/10-design-system/foundations/colors.md).',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
