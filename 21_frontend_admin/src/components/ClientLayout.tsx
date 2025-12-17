'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/hooks/useAuth';
import SidebarNew from '@/components/SidebarNew';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <AuthProvider>
            {!isLoginPage && <SidebarNew />}
            {!isLoginPage && <Header />}
            <main className={!isLoginPage ? "ml-64 pt-16 min-h-screen" : "min-h-screen"}>
                <div className={!isLoginPage ? "p-8" : ""}>
                    {children}
                </div>
            </main>
        </AuthProvider>
    );
}
