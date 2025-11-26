const request = require('supertest');
const app = require('../../src/app');

describe('Security Headers', () => {
  it('should return security headers configured by helmet', async () => {
    const res = await request(app).get('/');
    
    // Check for standard Helmet headers
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-download-options']).toBe('noopen');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-xss-protection']).toBe('0');
  });

  it('should return security headers on API routes', async () => {
    const res = await request(app).get('/api/health-check-non-existent');
    
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
