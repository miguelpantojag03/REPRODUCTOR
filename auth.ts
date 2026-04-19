import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

function hashPassword(password: string, secret: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(password + secret).digest('hex');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Password',   type: 'password' },
        name:     { label: 'Name',       type: 'text'     },
        phone:    { label: 'Phone',      type: 'tel'      },
        mode:     { label: 'Mode',       type: 'text'     },
      },
      async authorize(credentials) {
        try {
          const email    = String(credentials?.email    ?? '').toLowerCase().trim();
          const password = String(credentials?.password ?? '');
          const mode     = String(credentials?.mode     ?? 'login');
          const secret   = process.env.AUTH_SECRET ?? 'fallback-secret';

          // Basic validation
          if (!email)    return null;
          if (!password) return null;

          if (mode === 'register') {
            // Check duplicate
            const existing = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, email))
              .limit(1);

            if (existing.length > 0) {
              // Return null with a special marker so the client can show the right message
              // We encode the error in a fake email field trick isn't needed —
              // instead we return null and the client shows a generic message.
              // For custom messages, we throw — NextAuth v5 catches it as "CallbackRouteError"
              throw new Error('EMAIL_EXISTS');
            }

            const [newUser] = await db
              .insert(users)
              .values({
                id: uuidv4(),
                email,
                name: String(credentials?.name ?? email.split('@')[0]),
                phone: credentials?.phone ? String(credentials.phone) : null,
                passwordHash: hashPassword(password, secret),
                provider: 'credentials',
              })
              .returning();

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name ?? email.split('@')[0],
            };
          }

          // Login
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user)             throw new Error('USER_NOT_FOUND');
          if (!user.passwordHash) throw new Error('USE_GOOGLE');
          if (user.passwordHash !== hashPassword(password, secret)) {
            throw new Error('WRONG_PASSWORD');
          }

          return {
            id:    user.id,
            email: user.email,
            name:  user.name ?? email.split('@')[0],
            image: user.image,
          };
        } catch (err: any) {
          // Re-throw known errors so NextAuth passes them through
          if (err?.message && [
            'EMAIL_EXISTS', 'USER_NOT_FOUND', 'USE_GOOGLE', 'WRONG_PASSWORD'
          ].includes(err.message)) {
            throw err;
          }
          // Unknown DB error
          console.error('[Auth] authorize error:', err);
          throw new Error('SERVER_ERROR');
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await db
            .select({ id: users.id, googleId: users.googleId })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(users).values({
              id: uuidv4(),
              email: user.email,
              name: user.name ?? user.email.split('@')[0],
              image: user.image,
              provider: 'google',
              googleId: account.providerAccountId,
            });
          } else if (!existing[0].googleId) {
            await db
              .update(users)
              .set({ googleId: account.providerAccountId, image: user.image })
              .where(eq(users.email, user.email));
          }
        } catch (err) {
          console.error('[Auth] Google signIn error:', err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // On first sign-in, enrich token with DB user id
      if (user?.email) {
        try {
          const [dbUser] = await db
            .select({ id: users.id, name: users.name, image: users.image })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (dbUser) {
            token.sub   = dbUser.id;
            token.name  = dbUser.name ?? token.name;
            token.picture = dbUser.image ?? token.picture;
          }
        } catch { /* ignore */ }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub)     session.user.id    = token.sub;
      if (token.name)    session.user.name  = token.name as string;
      if (token.picture) session.user.image = token.picture as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: { strategy: 'jwt' },
});
