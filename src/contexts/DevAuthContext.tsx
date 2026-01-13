import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: Array<{ emailAddress: string }>;
  fullName: string;
}

interface DevAuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: DevUser | null;
  signIn: () => void;
  signOut: () => void;
}

const DevAuthContext = createContext<DevAuthContextType | null>(null);

const DEV_USER: DevUser = {
  id: 'dev_user_local_123',
  firstName: 'Dev',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'dev@localhost.test' }],
  fullName: 'Dev User',
};

export const DevAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('dev_auth_signed_in') === 'true';
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate Clerk loading time
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const signIn = () => {
    localStorage.setItem('dev_auth_signed_in', 'true');
    setIsSignedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem('dev_auth_signed_in');
    setIsSignedIn(false);
  };

  return (
    <DevAuthContext.Provider
      value={{
        isSignedIn,
        isLoaded,
        user: isSignedIn ? DEV_USER : null,
        signIn,
        signOut,
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
};

export const useDevAuth = () => {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useDevAuth must be used within DevAuthProvider');
  }
  return context;
};

// Development SignIn component
export const DevSignIn: React.FC<{
  afterSignInUrl?: string;
}> = ({ afterSignInUrl = '/dashboard' }) => {
  const { signIn } = useDevAuth();

  const handleSignIn = () => {
    signIn();
    window.location.href = afterSignInUrl;
  };

  return (
    <div className="bg-[#111111] border border-[#27272a] rounded-xl p-8 w-full max-w-md">
      <h2 className="text-xl font-bold text-white mb-2">Development Mode</h2>
      <p className="text-[#a1a1aa] mb-6 text-sm">
        Clerk auth is bypassed for localhost development.
        <br />
        Click below to sign in as a test user.
      </p>
      <button
        onClick={handleSignIn}
        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
      >
        Sign In as Dev User
      </button>
      <p className="text-[#71717a] text-xs mt-4 text-center">
        For production, configure Clerk with your domain.
      </p>
    </div>
  );
};

// Development SignUp component (same as SignIn for dev)
export const DevSignUp: React.FC<{
  afterSignUpUrl?: string;
}> = ({ afterSignUpUrl = '/dashboard' }) => {
  const { signIn } = useDevAuth();

  const handleSignUp = () => {
    signIn();
    window.location.href = afterSignUpUrl;
  };

  return (
    <div className="bg-[#111111] border border-[#27272a] rounded-xl p-8 w-full max-w-md">
      <h2 className="text-xl font-bold text-white mb-2">Development Mode</h2>
      <p className="text-[#a1a1aa] mb-6 text-sm">
        Clerk auth is bypassed for localhost development.
        <br />
        Click below to create a test account.
      </p>
      <button
        onClick={handleSignUp}
        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
      >
        Create Dev Account
      </button>
      <p className="text-[#71717a] text-xs mt-4 text-center">
        For production, configure Clerk with your domain.
      </p>
    </div>
  );
};

// Check if we're in development mode (localhost)
export const isDevMode = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
};
