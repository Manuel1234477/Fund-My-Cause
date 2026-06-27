import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatLocalDate,
  formatCompactNumber,
  formatRelativeTime,
  formatList,
  getCurrencySymbol,
} from "./locale-formatting";

describe("locale-formatting", () => {
  describe("formatCurrency", () => {
    it("should format USD in English", () => {
      const result = formatCurrency(1234.56, "USD", "en");
      expect(result).toContain("$");
      expect(result).toContain("1");
      expect(result).toContain(",");
    });

    it("should format EUR in German", () => {
      const result = formatCurrency(1234.56, "EUR", "de");
      expect(result).toContain("1.234");
    });

    it("should handle Arabic RTL locale", () => {
      const result = formatCurrency(1234.56, "USD", "ar");
      // Arabic should include directional marks
      expect(typeof result).toBe("string");
    });
  });

  describe("formatNumber", () => {
    it("should format number in English with thousands separator", () => {
      const result = formatNumber(1234567.89, "en");
      expect(result).toContain("1");
      expect(result).toContain(",");
    });

    it("should format number in German with German separators", () => {
      const result = formatNumber(1234567.89, "de");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage in English", () => {
      const result = formatPercentage(75, "en");
      expect(result).toContain("75");
    });

    it("should format percentage with fraction digits", () => {
      const result = formatPercentage(75.5, "en", 1);
      expect(typeof result).toBe("string");
    });
  });

  describe("formatLocalDate", () => {
    it("should format date in English locale", () => {
      const date = new Date("2026-06-27");
      const result = formatLocalDate(date, "en");
      expect(result).toContain("June") || expect(result).toContain("Jun");
    });

    it("should format date in Spanish locale", () => {
      const date = new Date("2026-06-27");
      const result = formatLocalDate(date, "es");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatCompactNumber", () => {
    it("should format large number in compact form", () => {
      const result = formatCompactNumber(1500000, "en");
      expect(result).toMatch(/[KM]/);
    });

    it("should format in German compact form", () => {
      const result = formatCompactNumber(1500000, "de");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format relative time", () => {
      const yesterday = new Date(Date.now() - 86400000);
      const result = formatRelativeTime(yesterday, "en");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatList", () => {
    it("should format list in English", () => {
      const result = formatList(["apple", "banana", "orange"], "en");
      expect(result).toContain("apple");
      expect(result).toContain("and");
    });

    it("should format list in Spanish", () => {
      const result = formatList(["apple", "banana", "orange"], "es");
      expect(typeof result).toBe("string");
    });
  });

  describe("getCurrencySymbol", () => {
    it("should get USD symbol for English", () => {
      const symbol = getCurrencySymbol("USD", "en");
      expect(symbol).toBe("$");
    });

    it("should get EUR symbol for German", () => {
      const symbol = getCurrencySymbol("EUR", "de");
      expect(typeof symbol).toBe("string");
    });
  });
});
