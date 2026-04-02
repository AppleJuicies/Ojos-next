import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  let redirectPath = '/sign-in?error=auth_error';

  if (code) {
    const cookieStore = await cookies();
    const cookieBuffer = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            // Buffer cookies to set directly on the response
            cookieBuffer.push(...cookiesToSet);
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options); } catch {}
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        redirectPath = !profile ? '/edit-profile' : `/profile/${user.id}`;
      }
    }

    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    // Set auth cookies directly on the redirect response
    cookieBuffer.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
