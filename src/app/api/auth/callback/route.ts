import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  findUserByEmail,
  createUser,
  updateUser,
} from '@/lib/supabase/db';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session?.user) {
      const { email, user_metadata } = session.user;
      const provider = session.user.app_metadata?.provider || 'email';

      if (email) {
        const normalizedEmail = email.toLowerCase();
        let existingUser = await findUserByEmail(normalizedEmail);

        if (!existingUser) {
          const name = user_metadata?.full_name || user_metadata?.name || email.split('@')[0];
          const nameParts = name.split(' ');
          const image = user_metadata?.avatar_url || user_metadata?.picture;

          await createUser({
            email: normalizedEmail,
            first_name: nameParts[0] || 'User',
            last_name: nameParts.slice(1).join(' ') || '',
            image,
            google_id: provider === 'google' ? session.user.id : undefined,
            github_id: provider === 'github' ? session.user.id : undefined,
          });
        } else {
          const updates: Record<string, string | undefined> = {};
          if (provider === 'google' && !existingUser.google_id) {
            updates.google_id = session.user.id;
          }
          if (provider === 'github' && !existingUser.github_id) {
            updates.github_id = session.user.id;
          }
          const image = user_metadata?.avatar_url || user_metadata?.picture;
          if (image && !existingUser.image) {
            updates.image = image;
          }
          if (Object.keys(updates).length > 0) {
            await updateUser(normalizedEmail, updates);
          }
        }
      }
    }
  }

  const forwardedHost = req.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const url = new URL(
    `${origin}${next.startsWith('/') ? next : `/${next}`}`,
  );

  if (isLocalEnv) {
    return NextResponse.redirect(url);
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(url);
}
