import '@testing-library/jest-dom'
// Provide a full in-memory IndexedDB implementation for all tests
import 'fake-indexeddb/auto'

// jsdom does not implement setPointerCapture / releasePointerCapture
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
  HTMLElement.prototype.hasPointerCapture = () => false
}
