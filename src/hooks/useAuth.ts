import { useMemo } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { useDevAuth, isDevMode } from '@/contexts/DevAuthContext';

// Unified user interface that works with both Clerk and dev mode
export interface AuthUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress?: { emailAddress: string };
}

export interface AuthState {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => void;
}

// Dev mode implementation
function useDevAuthState(): AuthState {
  const { user, isLoaded, isSignedIn, signOut } = useDevAuth();

  const authUser = useMemo(
    () =>
      user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            emailAddresses: user.emailAddresses,
            primaryEmailAddress: user.emailAddresses[0],
          }
        : null,
    [user]
  );

  return {
    user: authUser,
    isLoaded,
    isSignedIn,
    signOut,
  };
}

// Clerk mode implementation
function useClerkAuthState(): AuthState {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { signOut } = useClerk();

  const authUser = useMemo(
    () =>
      user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            emailAddresses: user.emailAddresses.map((e) => ({
              emailAddress: e.emailAddress,
            })),
            primaryEmailAddress: user.primaryEmailAddress
              ? { emailAddress: user.primaryEmailAddress.emailAddress }
              : undefined,
          }
        : null,
    [user]
  );

  return {
    user: authUser,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    signOut: () => signOut({ redirectUrl: '/' }),
  };
}

// Export the appropriate hook based on mode
export function useAuth(): AuthState {
  // This is a bit of a hack, but we need to call hooks at the top level
  // In production (non-dev mode), useDevAuth will throw because there's no provider
  // So we need to handle this conditionally
  if (isDevMode()) {
    return useDevAuthState();
  }
  return useClerkAuthState();
}

// Re-export for convenience
export { isDevMode };
