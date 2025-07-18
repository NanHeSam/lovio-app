import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build LangSmith trace URL from environment variables
 */
export function buildLangsmithTraceUrl(traceId: string): string | null {
  // Validate traceId parameter
  if (!traceId || traceId.trim() === '') {
    console.warn('Invalid traceId provided to buildLangsmithTraceUrl');
    return null;
  }
  
  const orgId = process.env.LANGCHAIN_ORG_ID;
  const projectId = process.env.LANGCHAIN_PROJECT_ID;
  
  if (!orgId || !projectId) {
    console.warn('Missing LANGCHAIN_ORG_ID or LANGCHAIN_PROJECT_ID environment variables');
    return null;
  }
  
  return `https://smith.langchain.com/o/${orgId}/projects/p/${projectId}/r/${traceId}`;
}
