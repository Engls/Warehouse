module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    'max-len': ['error', { code: 120 }],

    'linebreak-style': ['error', 'unix'],
    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
    'no-plusplus': 'off',
    camelcase: 'off',
  },
};
