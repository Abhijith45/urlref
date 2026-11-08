import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  const claimGuestLinks = useCallback(async () => {
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
  }, []);

  const syncBackendProfile = useCallback(async (isCancelled?: () => boolean) => {
    if (!isCancelled || !isCancelled()) {
      setIsSyncing(true);
    }

    try {
      const response = await apiClient.get<{ data: UserDto }>('/api/v1/auth/me');
      if (!isCancelled || !isCancelled()) {
        setBackendUser(response.data.data);
      }
      await claimGuestLinks();
    } catch {
      if (isSignedIn && clerkUser) {
        // Fallback to clerkUser details if backend is initializing
        if (!isCancelled || !isCancelled()) {
          setBackendUser({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: 'USER',
            createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
          });
        }
      } else {
        if (!isCancelled || !isCancelled()) {
          setBackendUser(null);
        }
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setIsSyncing(false);
      }
    }
  }, [isSignedIn, clerkUser, claimGuestLinks]);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    if (isLoaded) {
      syncBackendProfile(isCancelled);
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, syncBackendProfile]);

  const login = useCallback(async (credentials: LoginInput) => {
    const res = await apiClient.post<{ data: UserDto }>('/api/v1/auth/login', credentials);
    setBackendUser(res.data.data);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const res = await apiClient.post<{ data: UserDto }>('/api/v1/auth/register', data);
    setBackendUser(res.data.data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore background logout network errors
    }
    try {
      if (isSignedIn) {
        await signOut();
      }
    } finally {
      setBackendUser(null);
    }
  }, [isSignedIn, signOut]);

  const refetchUser = useCallback(async () => {
    await syncBackendProfile();
  }, [syncBackendProfile]);

  const user: UserDto | null = useMemo(() => {
    if (backendUser) return backendUser;
    if (isSignedIn && clerkUser) {
      return {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: 'USER',
        createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
      };
    }
    return null;
  }, [isSignedIn, clerkUser, backendUser]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading: !isLoaded || isSyncing,
      isAuthenticated: Boolean(isSignedIn || backendUser),
      login,
      register,
      logout,
      refetchUser,
    }),
    [user, isLoaded, isSyncing, isSignedIn, backendUser, login, register, logout, refetchUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
