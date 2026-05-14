// Ensure required environment variables are present at module import time.
// Importing this module will throw if the JWT secret is missing which makes
// the server fail-fast during startup/build instead of silently falling back.
export const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'Missing required environment variable: JWT_SECRET or NEXTAUTH_SECRET.\n' +
      'Set JWT_SECRET (or NEXTAUTH_SECRET) in your environment or provide a .env file.'
  );
}

export default {
  JWT_SECRET,
};
