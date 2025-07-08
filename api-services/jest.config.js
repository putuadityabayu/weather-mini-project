module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/app.ts",
        "!src/config/**/*.ts",
        "!src/utils/logger.ts",
        "!src/routes/**/*.ts",
        "!src/middlewares/**/*.ts"
    ],
    setupFilesAfterEnv: [],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/"
    ],
    moduleNameMapper: {
        "^@src(.*)$": "<rootDir>/src$1"
    }
};