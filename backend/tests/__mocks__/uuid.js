/**
 * Mock for uuid module to work with Jest/CommonJS
 */

// Simple UUID v4 generator for testing
function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

module.exports = {
  v4,
  // Add other uuid functions if needed
  v1: v4, // Simplified for testing
  v3: v4,
  v5: v4
}
