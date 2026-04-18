import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db/drizzle';
import { users, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'Correo electrónico',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        name: { label: 'Nombre', type: 'text' },
        mode: { label: 'Mode', type: 'text' }, // 'login' | 'register'
        phone: { label: 'Teléfono', type: 'tel' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password || '');
        const mode = String(credentials.mode || 'login');

        // Simple hash (in production use bcrypt)
        const hashPassword = (p: string) => {
          const crypto = require('crypto');
          return crypto.createHash('sha256').update(p + process.env.AUTH_SECRET).digest('hex');
        };

        if (mode === 'register') {
          // Check if user exists
          const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing.length > 0) throw new Error('El correo ya está registrado');

          const [newUser] = await db.insert(users).values({
            id: uuidv4(),
            email,
            name: String(credentials.name || email.split('@')[0]),
            phone: credentials.phone ? String(credentials.phone) : null,
            passwordHash: hashPassword(password),
            provider: 'credentials',
          }).returning();

          return { id: newUser.id, email: newUser.email, name: newUser.name };
        } else {
          // Login
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (!user) throw new Error('No existe una cuenta con ese correo');
          if (!user.passwordHash) throw new Error('Esta cuenta usa inicio de sesión social');
          if (user.passwordHash !== hashPassword(password)) throw new Error('Contraseña incorrecta');

          return { id: user.id, email: user.email, name: user.name };
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email!;
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            id: uuidv4(),
            email,
            name: user.name || email.split('@')[0],
            image: user.image,
            provider: 'google',
            googleId: account.providerAccountId,
          });
        } else if (!existing[0].googleId) {
          await db.update(users).set({
            googleId: account.providerAccountId,
            image: user.image,
          }).where(eq(users.email, email));
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Get user id from DB
        const dbUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
        if (dbUser[0]) token.sub = dbUser[0].id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
});
