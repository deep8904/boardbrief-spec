// Centralized error handling for edge functions
// Returns generic error messages to clients while logging details server-side

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

interface ErrorResponse {
  error: string;
  code: ErrorCode;
}

// Map error types to safe, generic messages
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Invalid request data',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  CONFLICT: 'Request conflicts with existing data',
  INTERNAL_ERROR: 'An unexpected error occurred',
};

export function createErrorResponse(code: ErrorCode, customMessage?: string): ErrorResponse {
  return {
    error: customMessage || ERROR_MESSAGES[code],
    code,
  };
}

// Safe error handler that logs details server-side and returns generic messages
export function handleError(error: unknown, functionName: string): { 
  response: ErrorResponse; 
  status: number 
} {
  // Always log full error details server-side for debugging
  console.error(`[${functionName}] Error:`, error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    // Only return field names, not full validation details
    const fields = error.errors.map(e => e.path.join('.')).filter(Boolean);
    return {
      response: createErrorResponse(
        'VALIDATION_ERROR',
        fields.length > 0 ? `Invalid fields: ${fields.join(', ')}` : 'Invalid request data'
      ),
      status: 400,
    };
  }

  // Handle known error types by message patterns (without exposing details)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('not found')) {
      return { response: createErrorResponse('NOT_FOUND'), status: 404 };
    }
    
    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return { response: createErrorResponse('UNAUTHORIZED'), status: 401 };
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return { response: createErrorResponse('FORBIDDEN'), status: 403 };
    }
    
    if (message.includes('conflict') || message.includes('duplicate')) {
      return { response: createErrorResponse('CONFLICT'), status: 409 };
    }
  }

  // Default to generic internal error
  return { response: createErrorResponse('INTERNAL_ERROR'), status: 500 };
}
