/**
 * Validation Utility Tests
 * Tests for email, password, username, and content validation
 */
import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUsername,
  validateComment,
  validatePostCaption,
  validateBio,
  validateSearchQuery,
  sanitizeText,
} from '../../../client/src/lib/validation';

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com',
        'first.last@company.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe("L'email ne peut pas être vide");
    });
  });

  describe('Username Validation', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['user123', 'test_user', 'john-doe', 'abc'];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject usernames shorter than 3 characters', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('au moins 3 caractères');
    });

    it('should reject usernames longer than 30 characters', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop long');
    });

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = ['user@123', 'test user', 'john.doe', 'user#123'];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('lettres, chiffres, _ et -');
      });
    });

    it('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
    });
  });

  describe('Comment Validation', () => {
    it('should accept valid comments', () => {
      const result = validateComment('This is a valid comment!');
      expect(result.valid).toBe(true);
    });

    it('should reject empty comments', () => {
      const result = validateComment('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ne peut pas être vide');
    });

    it('should reject comments exceeding max length', () => {
      const longComment = 'a'.repeat(501);
      const result = validateComment(longComment);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop long');
    });

    it('should detect XSS attempts in comments', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img onerror="alert(1)" src=x>',
        '<iframe src="evil.com"></iframe>',
        'onclick="alert(1)"'
      ];

      xssAttempts.forEach(attempt => {
        const result = validateComment(attempt);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Contenu suspect');
      });
    });
  });

  describe('Post Caption Validation', () => {
    it('should accept valid captions', () => {
      const result = validatePostCaption('Great photo! #sunset');
      expect(result.valid).toBe(true);
    });

    it('should accept empty captions (optional)', () => {
      const result = validatePostCaption('');
      expect(result.valid).toBe(true);
    });

    it('should reject captions exceeding max length', () => {
      const longCaption = 'a'.repeat(2201);
      const result = validatePostCaption(longCaption);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop longue');
    });

    it('should detect suspicious patterns', () => {
      const result = validatePostCaption('<script>alert(1)</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Contenu suspect');
    });
  });

  describe('Bio Validation', () => {
    it('should accept valid bios', () => {
      const result = validateBio('Software engineer from Quebec');
      expect(result.valid).toBe(true);
    });

    it('should accept empty bios (optional)', () => {
      const result = validateBio('');
      expect(result.valid).toBe(true);
    });

    it('should reject bios exceeding max length', () => {
      const longBio = 'a'.repeat(151);
      const result = validateBio(longBio);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop longue');
    });

    it('should detect suspicious patterns in bio', () => {
      const result = validateBio('<script>alert(1)</script>');
      expect(result.valid).toBe(false);
    });
  });

  describe('Search Query Validation', () => {
    it('should accept valid search queries', () => {
      const result = validateSearchQuery('montreal food');
      expect(result.valid).toBe(true);
    });

    it('should reject empty queries', () => {
      const result = validateSearchQuery('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ne peut pas être vide');
    });

    it('should reject queries exceeding max length', () => {
      const longQuery = 'a'.repeat(101);
      const result = validateSearchQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop longue');
    });

    it('should detect SQL injection attempts', () => {
      const sqlInjections = [
        "SELECT * FROM users",
        "DROP TABLE users",
        "UNION SELECT password",
      ];

      sqlInjections.forEach(injection => {
        const result = validateSearchQuery(injection);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalide');
      });
    });
  });

  describe('Text Sanitization', () => {
    it('should remove null bytes', () => {
      const result = sanitizeText('hello\0world');
      expect(result).toBe('helloworld');
    });

    it('should remove control characters', () => {
      const result = sanitizeText('hello\x00\x01\x02world');
      expect(result).toBe('helloworld');
    });

    it('should preserve valid text', () => {
      const text = 'Hello, World! 🎉';
      const result = sanitizeText(text);
      expect(result).toBe(text);
    });

    it('should trim whitespace', () => {
      const result = sanitizeText('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should preserve newlines and tabs', () => {
      const text = 'line1\nline2\tindented';
      const result = sanitizeText(text);
      expect(result).toBe(text);
    });
  });
});
