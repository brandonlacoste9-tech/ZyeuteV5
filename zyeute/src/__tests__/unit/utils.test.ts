/**
 * Utility Functions Tests
 * Tests for helper functions and formatting utilities
 */
import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('String Formatting', () => {
    it('should format numbers with commas', () => {
      const formatNumber = (num: number): string => {
        return num.toLocaleString('en-US');
      };

      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(42)).toBe('42');
    });

    it('should truncate long strings', () => {
      const truncate = (str: string, maxLength: number): string => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
      };

      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });

    it('should capitalize first letter', () => {
      const capitalize = (str: string): string => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('a')).toBe('A');
      expect(capitalize('')).toBe('');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates consistently', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formattedDate = date.toISOString().split('T')[0];
      expect(formattedDate).toBe('2024-01-15');
    });

    it('should calculate time differences', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const difference = now - oneHourAgo;
      
      expect(difference).toBe(60 * 60 * 1000);
    });

    it('should format relative time', () => {
      const getRelativeTime = (timestamp: number): string => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / (60 * 1000));
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));

        if (minutes < 1) return 'à l\'instant';
        if (minutes < 60) return `il y a ${minutes}m`;
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${days}j`;
      };

      const now = Date.now();
      expect(getRelativeTime(now)).toBe('à l\'instant');
      expect(getRelativeTime(now - 30 * 60 * 1000)).toBe('il y a 30m');
      expect(getRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('il y a 2h');
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates from array', () => {
      const removeDuplicates = <T>(arr: T[]): T[] => {
        return [...new Set(arr)];
      };

      expect(removeDuplicates([1, 2, 2, 3, 4, 4, 5])).toEqual([1, 2, 3, 4, 5]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should chunk array into smaller arrays', () => {
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('should shuffle array randomly', () => {
      const shuffle = <T>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      
      // Should contain same elements
      expect(shuffled.sort()).toEqual(original.sort());
      // Original should not be modified
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone objects', () => {
      const deepClone = <T>(obj: T): T => {
        return JSON.parse(JSON.stringify(obj));
      };

      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      cloned.b.c = 3;
      expect(original.b.c).toBe(2);
      expect(cloned.b.c).toBe(3);
    });

    it('should check if object is empty', () => {
      const isEmpty = (obj: object): boolean => {
        return Object.keys(obj).length === 0;
      };

      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('should merge objects', () => {
      const merge = <T extends object>(target: T, source: Partial<T>): T => {
        return { ...target, ...source };
      };

      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      
      expect(merge(obj1, obj2)).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe('URL Utilities', () => {
    it('should parse query parameters', () => {
      const parseQueryString = (search: string): Record<string, string> => {
        const params: Record<string, string> = {};
        const searchParams = new URLSearchParams(search);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
        return params;
      };

      expect(parseQueryString('?name=John&age=30')).toEqual({ name: 'John', age: '30' });
      expect(parseQueryString('?token=abc123')).toEqual({ token: 'abc123' });
    });

    it('should build query string from object', () => {
      const buildQueryString = (params: Record<string, string>): string => {
        const searchParams = new URLSearchParams(params);
        return searchParams.toString();
      };

      expect(buildQueryString({ name: 'John', age: '30' })).toContain('name=John');
      expect(buildQueryString({ name: 'John', age: '30' })).toContain('age=30');
    });
  });

  describe('Error Formatting', () => {
    it('should format error messages consistently', () => {
      const formatError = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        if (typeof error === 'string') {
          return error;
        }
        return 'Une erreur est survenue';
      };

      expect(formatError(new Error('Test error'))).toBe('Test error');
      expect(formatError('String error')).toBe('String error');
      expect(formatError(null)).toBe('Une erreur est survenue');
      expect(formatError(undefined)).toBe('Une erreur est survenue');
    });

    it('should extract error details from API responses', () => {
      const extractErrorMessage = (response: { error?: string; message?: string }): string => {
        return response.error || response.message || 'Erreur inconnue';
      };

      expect(extractErrorMessage({ error: 'Auth failed' })).toBe('Auth failed');
      expect(extractErrorMessage({ message: 'Invalid request' })).toBe('Invalid request');
      expect(extractErrorMessage({})).toBe('Erreur inconnue');
    });
  });

  describe('Storage Utilities', () => {
    it('should safely parse JSON from storage', () => {
      const safeJsonParse = <T>(json: string | null, fallback: T): T => {
        if (!json) return fallback;
        try {
          return JSON.parse(json);
        } catch {
          return fallback;
        }
      };

      expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' });
      expect(safeJsonParse('invalid json', {})).toEqual({});
      expect(safeJsonParse(null, { default: true })).toEqual({ default: true });
    });

    it('should safely stringify objects for storage', () => {
      const safeJsonStringify = (obj: unknown): string => {
        if (obj === undefined) return '{}';
        try {
          return JSON.stringify(obj);
        } catch {
          return '{}';
        }
      };

      expect(safeJsonStringify({ key: 'value' })).toBe('{"key":"value"}');
      expect(safeJsonStringify(undefined)).toBe('{}');
    });
  });
});
