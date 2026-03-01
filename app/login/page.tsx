"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SpeekLogo() {
  return (
    <div className="relative inline-flex items-center gap-3">
      <svg
        width="40"
        height="36"
        viewBox="0 0 32 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect x="0" y="18" width="4" height="10" fill="#FF5A1F" opacity="0.4" />
        <rect x="7" y="10" width="4" height="18" fill="#FF5A1F" opacity="0.6" />
        <rect x="14" y="4" width="4" height="24" fill="#FF5A1F" opacity="1" />
        <rect x="21" y="12" width="4" height="16" fill="#FF5A1F" opacity="0.7" />
        <rect x="28" y="20" width="4" height="8" fill="#FF5A1F" opacity="0.5" />
      </svg>
      <span
        className="text-3xl tracking-wider text-[#0A0A0A]"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        SPEEK
      </span>
      <span
        className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#FF5A1F]"
        aria-hidden
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(error);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <SpeekLogo />
        </div>
        <div className="rounded-xl border border-[#888888]/20 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <h1
            className="mb-2 text-center text-xl tracking-wide text-[#0A0A0A]"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            ENTRAR
          </h1>
          <p
            className="mb-8 text-center text-sm text-[#888888]"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            Suas reuniões viram posts. Aprove em segundos.
          </p>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FF5A1F] px-5 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#FF7A45] active:bg-[#CC3D0A]"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </button>
        </div>
        <p
          className="mt-8 text-center text-xs text-[#888888]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Um produto de 49 Educação
        </p>
      </div>
    </div>
  );
}
