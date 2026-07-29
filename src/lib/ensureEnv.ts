export const JWT_SECRET: string =
  process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error(
    'Missing required environment variable: JWT_SECRET.\n' +
      'Set JWT_SECRET in your environment or provide a .env file.',
  );
}
