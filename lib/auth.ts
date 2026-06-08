// Placeholder configuration for NextAuth to satisfy file structure requirements.
// For our client-side prototype, the interactive session is managed in lib/authContext.tsx.
export const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  }
};
export default authOptions;
