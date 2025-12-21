// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock IndexedDB for tests
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
}
