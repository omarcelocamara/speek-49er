"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SpeekLogo() {
  return (
    <div className="relative inline-flex items-center gap-3">
      <svg
        width="32"
        height="28"
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
        className="text-2xl tracking-wider text-[#0A0A0A]"
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

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copiar URL");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Se não houver usuário, volta para login
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setWebhookUrl(
        `https://marcelocamara.app.n8n.cloud/webhook/speekpost?founder_id=${user.id}`
      );
      setLoadingUser(false);
    };

    loadUser();
  }, [router, supabase]);

  const handleCopy = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopyLabel("Copiado!");
      setTimeout(() => setCopyLabel("Copiar URL"), 2000);
    } catch (_e) {
      setCopyLabel("Falha ao copiar");
      setTimeout(() => setCopyLabel("Copiar URL"), 2000);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("founders").upsert({
      id: userId,
      name,
      role,
    });

    setSaving(false);

    if (error) {
      setError("Não foi possível salvar seus dados. Tente novamente.");
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7F4] px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="mb-8 flex items-center justify-between">
          <SpeekLogo />
          <span
            className="font-mono text-xs text-[#888888]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            // AGENTE ONLINE · PROCESSANDO...
          </span>
        </div>

        <h1
          className="mb-2 text-2xl tracking-wide text-[#0A0A0A]"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          CONFIGURE SEU AGENTE
        </h1>
        <p
          className="mb-6 text-sm text-[#888888]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          2 minutos agora para nunca mais abrir o Google Docs depois de uma reunião.
        </p>

        {loadingUser ? (
          <p className="text-sm text-[#888888]">Carregando seu perfil...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <p
                className="mb-2 font-mono text-xs uppercase tracking-wide text-[#888888]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                PASSO 1 · SOBRE VOCÊ
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="block text-sm text-[#0A0A0A]"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                  >
                    Nome do founder
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#888888]/40 bg-[#F8F7F4] px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors duration-200 focus:border-[#FF5A1F] focus:bg-white"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                    placeholder="Ex: Marcelo Camara"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="role"
                    className="block text-sm text-[#0A0A0A]"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                  >
                    Cargo
                  </label>
                  <input
                    id="role"
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-[#888888]/40 bg-[#F8F7F4] px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors duration-200 focus:border-[#FF5A1F] focus:bg-white"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                    placeholder="Ex: Founder & CEO"
                  />
                </div>
              </div>
            </section>

            <section>
              <p
                className="mb-2 font-mono text-xs uppercase tracking-wide text-[#888888]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                PASSO 2 · WEBHOOK DO FIREFLIES
              </p>
              <p
                className="mb-3 text-sm text-[#0A0A0A]"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                Essa é a URL única do seu agente. É aqui que o Fireflies vai enviar as
                transcrições das suas reuniões.
              </p>

              <div className="mb-3 rounded-xl border border-[#888888]/40 bg-[#F8F7F4] p-3">
                <p
                  className="mb-1 text-xs text-[#888888]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  // WEBHOOK SPEEK 49er
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div
                    className="flex-1 truncate rounded-md bg-[#0A0A0A] px-3 py-2 text-xs text-[#F8F7F4]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {webhookUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="mt-2 w-full rounded-lg bg-[#FF5A1F] px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#FF7A45] active:bg-[#CC3D0A] sm:mt-0 sm:w-auto"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                  >
                    {copyLabel}
                  </button>
                </div>
              </div>

              <ol className="space-y-1.5 text-sm text-[#0A0A0A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                <li>1. Abra o Fireflies.</li>
                <li>2. Vá em <strong>Developer Settings → Webhook</strong>.</li>
                <li>3. Cole a URL acima e salve.</li>
                <li>4. Pronto: toda reunião gravada vai cair direto no SPEEK 49er.</li>
              </ol>
            </section>

            {error && (
              <p className="text-sm text-red-600" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || !name || !role}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#FF5A1F] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#FF7A45] active:bg-[#CC3D0A] disabled:opacity-60"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                {saving ? "Salvando..." : "Concluir configuração"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
