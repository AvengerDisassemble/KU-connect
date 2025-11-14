/**
 * @fileoverview Tests for JWT token encryption/decryption utilities
 */

const { encryptToken, decryptToken, generateAccessToken } = require('../../src/utils/tokenUtils');

describe('Token Encryption/Decryption', () => {
  test('should encrypt and decrypt a token successfully', () => {
    const originalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJTVFVERU5UIn0.test';
    
    const encrypted = encryptToken(originalToken);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(originalToken);
    
    // Encrypted token should have format: iv:authTag:encryptedData
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  test('should handle real JWT token encryption/decryption', () => {
    const token = generateAccessToken({ id: 'test-user-id', role: 'STUDENT' });
    
    const encrypted = encryptToken(token);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(token);
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(token);
  });

  test('should return null for invalid encrypted token format', () => {
    const invalid = 'invalid-token-format';
    const result = decryptToken(invalid);
    expect(result).toBeNull();
  });

  test('should return null for null/undefined input', () => {
    expect(decryptToken(null)).toBeNull();
    expect(decryptToken(undefined)).toBeNull();
    expect(decryptToken('')).toBeNull();
  });

  test('should return null for tampered encrypted token', () => {
    const originalToken = 'test-token-123';
    const encrypted = encryptToken(originalToken);
    
    // Tamper with the encrypted data
    const parts = encrypted.split(':');
    const tampered = `${parts[0]}:${parts[1]}:tampered${parts[2]}`;
    
    const result = decryptToken(tampered);
    expect(result).toBeNull();
  });

  test('should produce different encrypted output for same input (due to random IV)', () => {
    const token = 'same-token-value';
    
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);
    
    // Different encrypted values due to different IVs
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to the same original value
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });

  test('should handle long JWT tokens', () => {
    // Simulate a long JWT with lots of claims
    const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(1000);
    
    const encrypted = encryptToken(longToken);
    expect(encrypted).toBeTruthy();
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(longToken);
  });

  test('should handle special characters in token', () => {
    const tokenWithSpecialChars = 'token+with/special=characters_and-symbols';
    
    const encrypted = encryptToken(tokenWithSpecialChars);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(tokenWithSpecialChars);
  });
});
