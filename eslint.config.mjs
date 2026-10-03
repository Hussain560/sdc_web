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
  // The public pages keep their frozen legacy styling (D-009): same markup and inline hex values as before the rewrite.
  {
    files: [
      'src/modules/events/components/public/**/*.tsx',
      'src/modules/articles/components/public/**/*.tsx',
      // PDF colours cannot be CSS variables: the certificate uses the documented light-theme values.
      'src/modules/attendance/pdf/**/*.tsx',
      'src/modules/attendance/components/public/**/*.tsx',
      'src/modules/committees/components/public/**/*.tsx',
      'src/modules/registrations/components/useRegistrationFlow.tsx',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    '.next-auth/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
