/**
 * Input Validation Utilities
 * Security: Validates user inputs to prevent injection attacks and ensure data integrity
 */

export const MAX_COMMENT_LENGTH = 500;
export const MIN_COMMENT_LENGTH = 1;
export const MAX_POST_CAPTION_LENGTH = 2200;
export const MAX_BIO_LENGTH = 150;
export const MAX_SEARCH_QUERY_LENGTH = 100;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate comment input
 * Checks length and scans for suspicious patterns (XSS attempts)
 */
export function validateComment(text: string): ValidationResult {
  if (!text || text.trim().length < MIN_COMMENT_LENGTH) {
    return { valid: false, error: 'Le commentaire ne peut pas être vide' };
  }
  
  if (text.length > MAX_COMMENT_LENGTH) {
    return { 
      valid: false, 
      error: `Commentaire trop long (max ${MAX_COMMENT_LENGTH} caractères)` 
    };
  }
  
  // Check for suspicious patterns (script tags, javascript:, event handlers)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Contenu suspect détecté' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate post caption
 */
export function validatePostCaption(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    // Caption is optional, so empty is valid
    return { valid: true };
  }
  
  if (text.length > MAX_POST_CAPTION_LENGTH) {
    return { 
      valid: false, 
      error: `Légende trop longue (max ${MAX_POST_CAPTION_LENGTH} caractères)` 
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /<iframe/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Contenu suspect détecté' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate profile bio
 */
export function validateBio(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    // Bio is optional
    return { valid: true };
  }
  
  if (text.length > MAX_BIO_LENGTH) {
    return { 
      valid: false, 
      error: `Bio trop longue (max ${MAX_BIO_LENGTH} caractères)` 
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /<iframe/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Contenu suspect détecté' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate search query
 */
export function validateSearchQuery(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'La recherche ne peut pas être vide' };
  }
  
  if (text.length > MAX_SEARCH_QUERY_LENGTH) {
    return { 
      valid: false, 
      error: `Recherche trop longue (max ${MAX_SEARCH_QUERY_LENGTH} caractères)` 
    };
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bUPDATE\b)/i,
    /--/,
    /;/,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Requête invalide' };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitize text for display
 * Removes dangerous characters while preserving emojis and accents
 */
export function sanitizeText(text: string): string {
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Le nom d\'utilisateur ne peut pas être vide' };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Le nom d\'utilisateur est trop long (max 30 caractères)' };
  }
  
  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { 
      valid: false, 
      error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'L\'email ne peut pas être vide' };
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }
  
  return { valid: true };
}

