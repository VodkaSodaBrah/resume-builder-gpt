import React, { useState, useRef, useEffect } from 'react';
import { UserButton as ClerkUserButton } from '@clerk/clerk-react';
import { useAuth, isDevMode } from '@/hooks/useAuth';
import { User, LogOut } from 'lucide-react';

interface UserButtonProps {
  afterSignOutUrl?: string;
}

// Dev mode user button
const DevUserButton: React.FC<UserButtonProps> = ({ afterSignOutUrl = '/' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    window.location.href = afterSignOutUrl;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-green-600 transition-colors"
      >
        {user?.firstName?.[0] || 'D'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#27272a] rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#27272a]">
            <p className="text-sm font-medium text-white">
              {user?.fullName || 'Dev User'}
            </p>
            <p className="text-xs text-[#71717a]">
              {user?.emailAddresses?.[0]?.emailAddress || 'dev@localhost.test'}
            </p>
            <p className="text-xs text-yellow-500 mt-1">Development Mode</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-sm text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-white flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

// Unified UserButton that uses the appropriate implementation
export const UserButton: React.FC<UserButtonProps> = (props) => {
  if (isDevMode()) {
    return <DevUserButton {...props} />;
  }

  return (
    <ClerkUserButton
      afterSignOutUrl={props.afterSignOutUrl || '/'}
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
        },
      }}
    />
  );
};
