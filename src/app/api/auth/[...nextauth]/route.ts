import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// import AppleProvider from 'next-auth/providers/apple';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // TODO: Add Apple provider later
    // AppleProvider({
    //   clientId: process.env.APPLE_ID || '',
    //   clientSecret: process.env.APPLE_SECRET || '',
    // }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ user, token }: any) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };