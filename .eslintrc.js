module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },

  extends: ['plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    // Add here all the extra rules based on the developer preferences
    'prettier/prettier': ['error', { singleQuote: true, trailingComma: 'all' }],
  },
};
