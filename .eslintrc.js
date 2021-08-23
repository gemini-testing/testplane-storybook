module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    extends: [
        "gemini-testing",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true,
                allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            },
        ],
        "@typescript-eslint/no-use-before-define": [
            "error",
            {
                functions: false,
                classes: false,
                variables: true,
                typedefs: false,
            },
        ],
        "object-curly-spacing": ["error", "always"],
        quotes: ["error", "double", { avoidEscape: true }],
        "comma-dangle": ["error", "always-multiline"],
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "always",
                "named": "never",
                "asyncArrow": "always"
            },
        ],
    },
};
