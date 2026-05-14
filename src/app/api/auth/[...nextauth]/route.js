import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: false,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/google'
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !(await user.comparePassword(credentials.password))) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          plan: user.plan,
        };
      },
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectToDatabase();
        
        let existingUser = await User.findOne({ email: user.email });
        const image = user.image || profile?.picture;
        
        if (!existingUser) {
          const nameParts = user.name ? user.name.split(' ') : ['Google', 'User'];
          existingUser = await User.create({
            firstName: nameParts[0] || 'Google',
            lastName: nameParts.slice(1).join(' ') || 'User',
            email: user.email,
            googleId: account.providerAccountId,
            image: image
          });
        } else {
          if (!existingUser.googleId) {
            existingUser.googleId = account.providerAccountId;
          }
          if (image && !existingUser.image) {
            existingUser.image = image;
          }
          await existingUser.save();
        }
        
        return true;
      } catch (error) {
        console.error('Google signIn error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.plan = user.plan || 'free';
      }
      return token;
    },
    async session({ session, token }) {
      await connectToDatabase();
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        session.user.id = dbUser._id.toString();
        session.user.firstName = dbUser.firstName;
        session.user.lastName = dbUser.lastName;
        session.user.image = dbUser.image;
        session.user.plan = dbUser.plan;
      }
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;