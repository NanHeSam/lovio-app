/**
 * Validates and returns a properly formatted base URL from environment variables
 */
export function validateAndGetBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Check if base URL is defined
  if (!baseUrl) {
    // In development, use localhost as fallback
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    // In production, this is a critical error
    throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not defined. Please set it to your production URL.');
  }
  
  // Validate URL format
  try {
    const url = new URL(baseUrl);
    
    // Ensure it's HTTP or HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Base URL must use HTTP or HTTPS protocol');
    }
    
    // Return the base URL without trailing slash
    return baseUrl.replace(/\/$/, '');
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid NEXT_PUBLIC_BASE_URL format: ${baseUrl}. Please provide a valid URL.`);
    }
    throw error;
  }
}

/**
 * Validates environment variables required for email functionality
 * Only validates when actually needed (not at module load time)
 */
export function validateEmailEnvironment(): void {
  const requiredVars = ['RESEND_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}