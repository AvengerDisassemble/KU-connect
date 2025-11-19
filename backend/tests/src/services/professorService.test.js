/**
 * @fileoverview Unit tests for professorService utility functions
 * @module tests/src/services/professorService.test
 * @description Tests pure utility functions (no database mocking needed)
 * Note: Full integration tests with real database are in tests/controllers/professorController.test.js
 */

const {
  calculateStudentYear,
  calculateQualifiedRate,
  determineTrend
} = require('../../../src/services/professorService')

describe('Professor Service - Utility Functions (Unit Tests)', () => {
  describe('calculateStudentYear()', () => {
    it('should return "4+" for current year graduation (already graduated)', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear)
      expect(year).toBe('4+')
    })

    it('should return 4 for next year graduation', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear + 1)
      expect(year).toBe(4)
    })

    it('should return 3 for 2 years in future', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear + 2)
      expect(year).toBe(3)
    })

    it('should return 2 for 3 years in future', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear + 3)
      expect(year).toBe(2)
    })

    it('should return 1 for 4 years in future', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear + 4)
      expect(year).toBe(1)
    })

    it('should return "4+" for past graduation year', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear - 1)
      expect(year).toBe('4+')
    })

    it('should return 1 for 5+ years in future (freshmen)', () => {
      const currentYear = new Date().getFullYear()
      const year = calculateStudentYear(currentYear + 5)
      expect(year).toBe(1)
    })
  })

  describe('calculateQualifiedRate()', () => {
    it('should return 0 when total is 0', () => {
      const rate = calculateQualifiedRate(5, 0)
      expect(rate).toBe(0)
    })

    it('should return percentage with 1 decimal place', () => {
      const rate = calculateQualifiedRate(7, 20)
      expect(rate).toBe(35.0)
    })

    it('should round to 1 decimal place', () => {
      const rate = calculateQualifiedRate(1, 3)
      expect(rate).toBe(33.3)
    })

    it('should handle 100% qualified rate', () => {
      const rate = calculateQualifiedRate(10, 10)
      expect(rate).toBe(100.0)
    })

    it('should handle 0% qualified rate', () => {
      const rate = calculateQualifiedRate(0, 10)
      expect(rate).toBe(0.0)
    })
  })

  describe('determineTrend()', () => {
    it('should return "increasing" for change > 5%', () => {
      const trend = determineTrend(10)
      expect(trend).toBe('increasing')
    })

    it('should return "decreasing" for change < -5%', () => {
      const trend = determineTrend(-10)
      expect(trend).toBe('decreasing')
    })

    it('should return "stable" for change between -5% and 5%', () => {
      expect(determineTrend(0)).toBe('stable')
      expect(determineTrend(3)).toBe('stable')
      expect(determineTrend(-3)).toBe('stable')
      expect(determineTrend(5)).toBe('stable')
      expect(determineTrend(-5)).toBe('stable')
    })

    it('should return "increasing" for exactly 5.1%', () => {
      const trend = determineTrend(5.1)
      expect(trend).toBe('increasing')
    })

    it('should return "decreasing" for exactly -5.1%', () => {
      const trend = determineTrend(-5.1)
      expect(trend).toBe('decreasing')
    })
  })
})
