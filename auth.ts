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

// Use a stable fallback secret so the app works even without AUTH_SECRET env var
const SECRET = process.env.AUTH_SECRET || 'music-player-default-secret-change-in-production';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: SECRET,
  trustHost: true,

  providers: [
    // Google only works if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),

    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        name:     { label: 'Name',     type: 'text'     },
        phone:    { label: 'Phone',    type: 'tel'      },
        mode:     { label: 'Mode',     type: 'text'     },
      },
      async authorize(credentials) {
        try {
          const email    = String(credentials?.email    ?? '').toLowerCase().trim();
          const password = String(credentials?.password ?? '');
          const mode     = String(credentials?.mode     ?? 'login');

          if (!email || !password) return null;

          if (mode === 'register') {
            const existing = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, email))
              .limit(1);

            if (existing.length > 0) throw new Error('EMAIL_EXISTS');

            const [newUser] = await db
              .insert(users)
              .values({
                id: uuidv4(),
                email,
                name: String(credentials?.name ?? email.split('@')[0]),
                phone: credentials?.phone ? String(credentials.phone) : null,
                passwordHash: hashPassword(password, SECRET),
                provider: 'credentials',
              })
              .returning();

            return { id: newUser.id, email: newUser.email, name: newUser.name ?? email.split('@')[0] };
          }

          // Login
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user)              throw new Error('USER_NOT_FOUND');
          if (!user.passwordHash) throw new Error('USE_GOOGLE');
          if (user.passwordHash !== hashPassword(password, SECRET)) throw new Error('WRONG_PASSWORD');

          return { id: user.id, email: user.email, name: user.name ?? email.split('@')[0], image: user.image };
        } catch (err: any) {
          const known = ['EMAIL_EXISTS', 'USER_NOT_FOUND', 'USE_GOOGLE', 'WRONG_PASSWORD'];
          if (known.includes(err?.message)) throw err;
          console.error('[Auth]', err);
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
            await db.update(users)
              .set({ googleId: account.providerAccountId, image: user.image })
              .where(eq(users.email, user.email));
          }
        } catch (err) {
          console.error('[Auth] Google signIn:', err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const [dbUser] = await db
            .select({ id: users.id, name: users.name, image: users.image })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);
          if (dbUser) {
            token.sub     = dbUser.id;
            token.name    = dbUser.name ?? token.name;
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

  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
});
