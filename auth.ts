import NextAuth, { CredentialsSignin } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Custom error class so the message reaches the client
class AuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.code = message;
  }
}

function hashPassword(password: string, secret: string): string {
  // Use require to avoid Edge Runtime issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(password + secret).digest('hex');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: {},
        password: {},
        name: {},
        phone: {},
        mode: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim();
        const password = String(credentials?.password ?? '');
        const mode = String(credentials?.mode ?? 'login');
        const secret = process.env.AUTH_SECRET ?? 'fallback-secret';

        if (!email || !password) {
          throw new AuthError('Completa todos los campos');
        }

        if (password.length < 6) {
          throw new AuthError('La contraseña debe tener al menos 6 caracteres');
        }

        if (mode === 'register') {
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existing.length > 0) {
            throw new AuthError('Ya existe una cuenta con ese correo');
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

        if (!user) {
          throw new AuthError('No existe una cuenta con ese correo');
        }

        if (!user.passwordHash) {
          throw new AuthError('Esta cuenta usa inicio de sesión con Google');
        }

        if (user.passwordHash !== hashPassword(password, secret)) {
          throw new AuthError('Contraseña incorrecta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? email.split('@')[0],
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Auto-create user on Google sign-in
      if (account?.provider === 'google' && user.email) {
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
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const [dbUser] = await db
          .select({ id: users.id, name: users.name, image: users.image })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.name) session.user.name = token.name as string;
      if (token.picture) session.user.image = token.picture as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
  trustHost: true,
});
