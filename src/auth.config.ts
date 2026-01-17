import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === '/';
            const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');

            // 1. Protect Dashboard (Main Route)
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            // 2. Protect Onboarding
            if (isOnOnboarding) {
                if (isLoggedIn) return true;
                return false;
            }

            // 3. Redirect authenticated users away from Login page
            if (nextUrl.pathname.startsWith('/login')) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
            }

            return true;
        },
    },
    providers: [], // Providers will be added in the main auth.ts
} satisfies NextAuthConfig;
