module.exports = {
    clearMocks: true,
    globals: {
        "ts-jest": {
            "tsconfig": "tsconfig.spec.json",
        },
    },
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["jest-extended"],
    testMatch: [
        "**/src/**/*.test.ts",
    ],
    modulePathIgnorePatterns: [
        "<rootDir>/build",
    ],
    verbose: true,
};
