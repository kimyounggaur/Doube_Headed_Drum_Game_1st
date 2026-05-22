/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.app.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: ['./tsconfig.app.json'] },
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import', 'prettier'],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 리듬 엔진의 클래스 메서드에서 this를 쓰지 않을 수 있어 완화
    'class-methods-use-this': 'off',
    // 짧은 삼항 중첩은 가독성에 큰 해가 없어 경고로 다운그레이드 (lane/grade 표 매핑 등)
    'no-nested-ternary': 'warn',
    // JSX 콜백에서 인라인 함수는 React에서 일반적
    'react/jsx-no-bind': 'off',
    // tabIndex 명시 등 a11y 강제는 프로토타입 단계 완화
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
    'no-await-in-loop': 'off',
    // 5x5 고정 그리드 등 위치가 의미를 가지는 경우 index가 키로 적합 — 경고로 다운그레이드
    'react/no-array-index-key': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.ts', '.eslintrc.cjs'],
};
