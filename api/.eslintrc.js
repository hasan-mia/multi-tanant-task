module.exports = {
  env: { node: true, es2021: true, commonjs: true },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["unused-imports", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "no-unused-vars": "off",
    "prefer-const": "error",
    "no-var": "error",
    quotes: "off",
  },
  ignorePatterns: ["node_modules/", "dist/", "build/"],
  overrides: [
    {
      files: ["src/migrations/**/*.js"],
      rules: {
        "unused-imports/no-unused-vars": [
          "error",
          {
            vars: "all",
            varsIgnorePattern: "^_|^Sequelize$",
            args: "none",
          },
        ],
      },
    },
  ],
};
