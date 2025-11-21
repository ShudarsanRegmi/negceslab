// Firebase Auth Error Codes and User-Friendly Messages
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    // Email/Password Authentication Errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please try signing in instead.';
    
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check your email or sign up.';
    
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    // Too Many Requests
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    
    // Email Verification Errors
    case 'auth/expired-action-code':
      return 'This verification link has expired. Please request a new one.';
    
    case 'auth/invalid-action-code':
      return 'This verification link is invalid. Please request a new one.';
    
    case 'auth/user-token-expired':
      return 'Your session has expired. Please sign in again.';
    
    // Password Reset Errors
    case 'auth/invalid-continue-uri':
      return 'Invalid password reset link. Please try requesting a new one.';
    
    case 'auth/missing-continue-uri':
      return 'Password reset link is incomplete. Please try requesting a new one.';
    
    // Network/Connection Errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/timeout':
      return 'Request timed out. Please check your connection and try again.';
    
    // Social Authentication Errors
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in method. Please try signing in with your original method.';
    
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for authentication. Please contact support.';
    
    // Email Verification Specific
    case 'auth/email-already-verified':
      return 'Your email is already verified. You can proceed to sign in.';
    
    // Invalid credentials (general)
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'auth/user-mismatch':
      return 'The credentials do not match the current user. Please try again.';
    
    case 'auth/requires-recent-login':
      return 'For security reasons, please sign out and sign in again to perform this action.';
    
    // Quota exceeded
    case 'auth/quota-exceeded':
      return 'Too many requests. Please try again later.';
    
    // Custom token errors
    case 'auth/custom-token-mismatch':
      return 'Authentication error. Please try signing in again.';
    
    case 'auth/invalid-custom-token':
      return 'Authentication error. Please try signing in again.';
    
    // Provider errors
    case 'auth/provider-already-linked':
      return 'This account is already linked with this provider.';
    
    case 'auth/no-such-provider':
      return 'This authentication provider is not available.';
    
    // Multi-factor authentication
    case 'auth/multi-factor-auth-required':
      return 'Multi-factor authentication is required. Please complete the verification process.';
    
    case 'auth/maximum-second-factor-count-exceeded':
      return 'Maximum number of second factors exceeded.';
    
    case 'auth/second-factor-already-in-use':
      return 'This second factor is already in use.';
    
    // App-specific errors
    case 'auth/app-deleted':
      return 'Application error. Please contact support.';
    
    case 'auth/app-not-authorized':
      return 'Application is not authorized. Please contact support.';
    
    case 'auth/argument-error':
      return 'Invalid request. Please try again.';
    
    case 'auth/invalid-api-key':
      return 'Application configuration error. Please contact support.';
    
    case 'auth/invalid-user-token':
      return 'User authentication error. Please sign in again.';
    
    case 'auth/invalid-tenant-id':
      return 'Invalid tenant configuration. Please contact support.';
    
    case 'auth/missing-android-pkg-name':
    case 'auth/missing-ios-bundle-id':
      return 'Mobile app configuration error. Please contact support.';
    
    // Default case for unknown errors
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
};

// Helper function to extract error code from Firebase error
export const getFirebaseErrorCode = (error: any): string => {
  // Firebase errors have a 'code' property
  if (error?.code) {
    return error.code;
  }
  
  // Sometimes the error might be nested
  if (error?.error?.code) {
    return error.error.code;
  }
  
  // Fallback to message parsing if available
  if (error?.message && error.message.includes('auth/')) {
    const match = error.message.match(/auth\/[a-z-]+/);
    if (match) {
      return match[0];
    }
  }
  
  return 'unknown-error';
};

// Main function to get user-friendly error message from Firebase error
export const handleFirebaseAuthError = (error: any): string => {
  const errorCode = getFirebaseErrorCode(error);
  return getAuthErrorMessage(errorCode);
};
