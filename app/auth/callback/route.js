import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_error`);
  }

  try {
    const cookieStore = await cookies();
    const cookieBuffer = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookieBuffer.push(...cookiesToSet);
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options); } catch {}
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user after exchange');

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    const redirectPath = profile ? `/profile/${user.id}` : '/edit-profile';
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    cookieBuffer.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;

  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(`${origin}/sign-in?error=auth_error`);
  }
}
