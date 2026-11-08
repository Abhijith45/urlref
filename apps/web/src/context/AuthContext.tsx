import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { apiClient } from '../services/api-client';
import { UserDto, LoginInput, RegisterInput } from '@shortener/shared';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [backendUser, setBackendUser] = useState<UserDto | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const claimGuestLinks = async () => {
    try {
      const saved = localStorage.getItem('urlref_guest_link');
      if (saved) {
        const link = JSON.parse(saved);
        if (link && link.id) {
          await apiClient.post('/api/v1/links/claim', { linkIds: [link.id] });
        }
        localStorage.removeItem('urlref_guest_link');
      }
    } catch {
      // Ignore background claiming errors gracefully
    }
  };

  const syncBackendProfile = async () => {
    if (!isSignedIn || !clerkUser) {
      setBackendUser(null);
      return;
    }

    setIsSyncing(true);
    try {
      const response = await apiClient.get<{ data: UserDto }>('/api/v1/auth/me');
      setBackendUser(response.data.data);
      await claimGuestLinks();
    } catch {
      // Fallback to clerkUser details if backend is initializing
      setBackendUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: 'USER',
        createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      syncBackendProfile();
    }
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const login = async (_credentials: LoginInput) => {
    // Handled by Clerk SignIn component
  };

  const register = async (_data: RegisterInput) => {
    // Handled by Clerk SignUp component
  };

  const logout = async () => {
    try {
      await signOut();
    } finally {
      setBackendUser(null);
    }
  };

  const refetchUser = async () => {
    await syncBackendProfile();
  };

  const user: UserDto | null = isSignedIn && clerkUser
    ? backendUser || {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: 'USER',
        createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded || isSyncing,
        isAuthenticated: !!isSignedIn,
        login,
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
