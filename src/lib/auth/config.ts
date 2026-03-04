import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { appUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { loginSchema } from '@/lib/validations/auth';
import '@/lib/auth/types';

// Account lockout: 5 failed attempts → 15 min lock
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkLockout(username: string): boolean {
  const record = failedAttempts.get(username);
  if (!record) return false;
  if (record.lockedUntil > Date.now()) return true;
  // Lock expired, reset
  failedAttempts.delete(username);
  return false;
}

function recordFailedAttempt(username: string): void {
  const record = failedAttempts.get(username) || { count: 0, lockedUntil: 0 };
  record.count++;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  failedAttempts.set(username, record);
}

function clearFailedAttempts(username: string): void {
  failedAttempts.delete(username);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        // Check account lockout
        if (checkLockout(username)) return null;

        const user = await db.query.appUsers.findFirst({
          where: eq(appUsers.username, username),
        });

        if (!user || !user.activo) {
          recordFailedAttempt(username);
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          recordFailedAttempt(username);
          return null;
        }

        clearFailedAttempts(username);
        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          perfil: user.perfil,
          username: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (work shift)
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.perfil = (user as { perfil: string }).perfil;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.perfil = token.perfil as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  trustHost: true,
});
