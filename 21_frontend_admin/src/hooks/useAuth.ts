'use client';

import { useState, useEffect, createContext, useContext, createElement } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/api/client';

interface User {
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const token = sessionStorage.getItem('accessToken');
            if (token) {
                try {
                    apiClient.get('/users/me')
                        .then(userData => setUser(userData))
                        .catch(() => logout());
                } catch (error) {
                    logout();
                }
            } else {
                if (pathname !== '/login') {
                    router.push('/login');
                }
            }
            setIsLoading(false);
        };

        if (typeof window !== 'undefined') {
            initAuth();
        }
    }, []);

    const login = (token: string, refreshToken: string) => {
        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('refreshToken', refreshToken);

        apiClient.get('/users/me').then(userData => {
            setUser(userData);
            router.push('/');
        }).catch(err => {
            console.error(err);
            router.push('/');
        });
    };

    const logout = () => {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        setUser(null);
        if (pathname !== '/login') {
            router.push('/login');
        }
    };

    const providerValue = { user, login, logout, isLoading };

    return createElement(AuthContext.Provider, { value: providerValue }, children);
}

export const useAuth = () => useContext(AuthContext);
