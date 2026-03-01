import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isAuthCallback = pathname.startsWith("/auth");
  const isOnboarding = pathname === "/onboarding";

  // Não autenticado: manda para /login (exceto página de login e callbacks)
  if (!user && !isLoginPage && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Se usuário já autenticado tenta acessar /login, decide destino pelo onboarding
    if (isLoginPage) {
      const { data: founder } = await supabase
        .from("founders")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      const url = request.nextUrl.clone();
      url.pathname = founder ? "/" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // Para qualquer rota protegida (exceto /onboarding e callbacks),
    // garante que o founder já passou pelo onboarding.
    if (!isOnboarding && !isAuthCallback) {
      const { data: founder } = await supabase
        .from("founders")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!founder) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
