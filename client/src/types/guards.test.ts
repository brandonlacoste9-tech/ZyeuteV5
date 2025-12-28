/**
 * Type Guards Tests
 * Tests for runtime type validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isUser,
  isPost,
  isComment,
  isPostArray,
  isCommentArray,
  isUserArray,
  validateUser,
  validatePost,
  isVideoPost,
  hasVideoProcessingStatus,
  extractVideoMetadata,
} from './guards';
import type { User, Post, Comment } from './index';

describe('Type Guards', () => {
  describe('isUser', () => {
    it('should validate a valid user object', () => {
      const validUser: User = {
        id: '123',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        city: null,
        region: null,
        is_verified: false,
        coins: 100,
        fire_score: 50,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isUser(validUser)).toBe(true);
    });

    it('should reject invalid user objects', () => {
      expect(isUser(null)).toBe(false);
      expect(isUser(undefined)).toBe(false);
      expect(isUser({})).toBe(false);
      expect(isUser({ id: '123' })).toBe(false);
      expect(isUser({ id: 123, username: 'test' })).toBe(false); // id should be string
    });
  });

  describe('isPost', () => {
    it('should validate a valid post object', () => {
      const validPost: Post = {
        id: '456',
        user_id: '123',
        type: 'photo',
        media_url: 'https://example.com/photo.jpg',
        thumbnail_url: null,
        caption: 'Test caption',
        hashtags: ['test'],
        region: null,
        city: null,
        fire_count: 10,
        comment_count: 5,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(isPost(validPost)).toBe(true);
    });

    it('should reject invalid post objects', () => {
      expect(isPost(null)).toBe(false);
      expect(isPost({})).toBe(false);
      expect(isPost({ id: '456', type: 'invalid' })).toBe(false);
    });

    it('should validate video posts', () => {
      const videoPost: Post = {
        id: '789',
        user_id: '123',
        type: 'video',
        media_url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/thumb.jpg',
        caption: null,
        hashtags: null,
        region: null,
        city: null,
        fire_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(isPost(videoPost)).toBe(true);
      expect(isVideoPost(videoPost)).toBe(true);
    });
  });

  describe('isComment', () => {
    it('should validate a valid comment object', () => {
      const validComment: Comment = {
        id: '789',
        post_id: '456',
        user_id: '123',
        text: 'Test comment',
        content: 'Test comment',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(isComment(validComment)).toBe(true);
    });

    it('should reject invalid comment objects', () => {
      expect(isComment(null)).toBe(false);
      expect(isComment({})).toBe(false);
    });
  });

  describe('Array validators', () => {
    it('should validate arrays of posts', () => {
      const posts: Post[] = [
        {
          id: '1',
          user_id: '123',
          type: 'photo',
          media_url: 'url1',
          thumbnail_url: null,
          caption: null,
          hashtags: null,
          region: null,
          city: null,
          fire_count: 0,
          comment_count: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      expect(isPostArray(posts)).toBe(true);
      expect(isPostArray([])).toBe(true);
      expect(isPostArray([{}])).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('should return user if valid', () => {
      const validUser: User = {
        id: '123',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        bio: null,
        city: null,
        region: null,
        is_verified: false,
        coins: 0,
        fire_score: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(validateUser(validUser)).toEqual(validUser);
    });

    it('should throw error for invalid user', () => {
      expect(() => validateUser({})).toThrow('Invalid user data');
      expect(() => validateUser(null)).toThrow('Invalid user data');
    });
  });

  describe('Video metadata extraction', () => {
    it('should identify video posts', () => {
      const videoPost: Post = {
        id: '1',
        user_id: '123',
        type: 'video',
        media_url: 'video.mp4',
        thumbnail_url: null,
        caption: null,
        hashtags: null,
        region: null,
        city: null,
        fire_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(isVideoPost(videoPost)).toBe(true);
    });

    it('should extract video metadata', () => {
      const videoPost: Post = {
        id: '1',
        user_id: '123',
        type: 'video',
        media_url: 'video.mp4',
        thumbnail_url: 'thumb.jpg',
        caption: null,
        hashtags: null,
        region: null,
        city: null,
        fire_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        processing_status: 'completed',
      };

      const metadata = extractVideoMetadata(videoPost);
      expect(metadata).toBeTruthy();
      expect(metadata?.media_url).toBe('video.mp4');
      expect(metadata?.thumbnail_url).toBe('thumb.jpg');
      expect(metadata?.processing_status).toBe('completed');
    });

    it('should return null for photo posts', () => {
      const photoPost: Post = {
        id: '1',
        user_id: '123',
        type: 'photo',
        media_url: 'photo.jpg',
        thumbnail_url: null,
        caption: null,
        hashtags: null,
        region: null,
        city: null,
        fire_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(extractVideoMetadata(photoPost)).toBeNull();
    });

    it('should validate processing status', () => {
      const videoPost: Post = {
        id: '1',
        user_id: '123',
        type: 'video',
        media_url: 'video.mp4',
        thumbnail_url: null,
        caption: null,
        hashtags: null,
        region: null,
        city: null,
        fire_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        processing_status: 'completed',
      };

      expect(hasVideoProcessingStatus(videoPost)).toBe(true);
    });
  });
});
