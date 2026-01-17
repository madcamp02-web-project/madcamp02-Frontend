import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
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
