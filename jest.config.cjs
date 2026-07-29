module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': ['babel-jest', { configFile: false, presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
