// Clerk metadata types
export interface UserPublicMetadata {
  onboardingComplete?: boolean;
}

export interface UserPrivateMetadata {
  // Add private metadata fields here if needed
}

export interface UserUnsafeMetadata {
  onboardingComplete?: boolean;
}

// Note: Client-side user.update() only supports unsafeMetadata
// Server-side sessionClaims can access metadata, unsafeMetadata, and privateMetadata