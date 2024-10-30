module.exports = {
    clearMocks: true,
    globals: {
        "ts-jest": {
            "tsconfig": "tsconfig.spec.json",
        },
    },
    setupFilesAfterEnv: ["jest-extended/all", "jest-when"],
    testMatch: [
        "**/src/**/*.test.ts",
    ],
    modulePathIgnorePatterns: [
        "/node_modules/",
        "/build/",
    ],
    verbose: true,
};
