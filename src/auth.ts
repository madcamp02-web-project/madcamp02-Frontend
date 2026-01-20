import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';

// AUTH_SECRET 환경변수 검증
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!authSecret) {
    console.warn(
        '⚠️  AUTH_SECRET이 설정되지 않았습니다. ' +
        '.env.local 파일에 AUTH_SECRET을 추가해주세요. ' +
        '개발 환경에서는 임시로 fallback secret을 사용합니다.'
    );
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: authSecret || 'fallback-secret-key-change-in-production-minimum-32-characters',
    providers: [
        Credentials({
            async authorize(credentials) {
                // Mock Login for Development using Zod validation stub
                // In real app, check against DB or API
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    return {
                        id: 'user-1',
                        name: '황금손',
                        email: parsedCredentials.data.email,
                        image: 'https://avatar.vercel.sh/user-1', // Mock Avatar
                    };
                }

                console.log('Invalid credentials');
                return null; // Return null on failure
            },
        }),
    ],
});
