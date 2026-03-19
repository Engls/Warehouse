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
  },
};