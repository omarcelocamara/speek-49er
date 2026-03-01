"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Post, PostStatus } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMeetingDayLabel(dateStr?: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOf(today).getTime() - startOf(date).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";

  return date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
}

function SpeekLogo() {
  return (
    <div className="relative inline-flex items-center gap-3">
      {/* Waveform SVG - 5 barras verticais */}
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
      {/* Wordmark SPEEK */}
      <span
        className="text-2xl tracking-wider text-[#0A0A0A]"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        SPEEK
      </span>
      {/* Ponto laranja indicador ativo */}
      <span
        className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#FF5A1F]"
        aria-hidden
      />
    </div>
  );
}

type MeetingInfo = {
  id: string;
  title: string | null;
  meeting_date: string | null;
};

type PostWithMeeting = Post & { meeting?: MeetingInfo };

async function fetchPosts(supabase: SupabaseClient): Promise<PostWithMeeting[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar posts:", error);
    return [];
  }
  if (!posts?.length) return [];

  const meetingIds = [...new Set(posts.map((p) => p.meeting_id))];
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, meeting_date")
    .in("id", meetingIds);

  const meetingMap = new Map<string, MeetingInfo>(
    (meetings || []).map((m: any) => [
      m.id,
      {
        id: m.id,
        title: m.title ?? null,
        meeting_date: m.meeting_date ?? null,
      },
    ])
  );

  return posts.map((p) => ({
    ...p,
    meeting: meetingMap.get(p.meeting_id),
  }));
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(
    () => new Set()
  );

  const loadPosts = async () => {
    setLoading(true);
    const data = await fetchPosts(supabase);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (postId: string, status: PostStatus) => {
    setUpdatingId(postId);
    await supabase.from("posts").update({ status }).eq("id", postId);
    await loadPosts();
    setUpdatingId(null);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const toggleExpand = (postId: string) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const pending = posts.filter((p) => p.status === "pending");
  const approved = posts.filter((p) => p.status === "approved");

  const pendingByMeeting = new Map<
    string,
    { meeting?: MeetingInfo; posts: PostWithMeeting[] }
  >();
  for (const post of pending) {
    const existing = pendingByMeeting.get(post.meeting_id) ?? {
      meeting: post.meeting,
      posts: [],
    };
    existing.posts.push(post);
    if (!existing.meeting && post.meeting) {
      existing.meeting = post.meeting;
    }
    pendingByMeeting.set(post.meeting_id, existing);
  }
  const pendingGroups = Array.from(pendingByMeeting.entries());

  const totalMeetingsProcessed = new Set(posts.map((p) => p.meeting_id)).size;

  const now = new Date();
  const approvedThisMonth = approved.filter((post) => {
    const d = new Date(post.created_at);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const pendingToday = pending.filter((post) => {
    const meetingDate = post.meeting?.meeting_date;
    if (!meetingDate) return false;
    const d = new Date(meetingDate);
    return isSameDay(d, now);
  }).length;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* HEADER */}
      <header className="border-b border-[#888888]/20 bg-[#F8F7F4]">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <SpeekLogo />
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-col gap-1">
              <div
                className="inline-flex items-center gap-2 font-mono text-xs text-[#0A0A0A]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-green-500"
                  aria-hidden
                />
                // AGENTE ONLINE
              </div>
              <p
                className="text-sm font-light text-[#888888]"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                Suas reuniões. Seu conteúdo. Automático.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-[#888888] bg-transparent px-4 py-2 text-sm font-medium text-[#888888] transition-colors duration-200 hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-10">
        {loading && posts.length === 0 ? (
          /* Loading skeleton */
          <div className="space-y-6">
            <div
              className="h-8 w-64 rounded bg-[#FF7A45]/20"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#888888]/20 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="mb-3 h-4 w-24 rounded bg-[#FF7A45]/30 font-mono text-sm" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-[#888888]/10" />
                    <div className="h-4 w-3/4 rounded bg-[#888888]/10" />
                  </div>
                  <div className="mt-4 h-9 w-24 rounded bg-[#FF5A1F]/50" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* STATS BANNER */}
            <section className="mb-10 grid gap-4 rounded-2xl border border-[#888888]/20 bg-white/70 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:grid-cols-3">
              <div className="flex flex-col">
                <span
                  className="text-xs uppercase tracking-wide text-[#888888]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Reuniões processadas
                </span>
                <span
                  className="mt-2 text-2xl text-[#0A0A0A]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {totalMeetingsProcessed}
                </span>
                <span className="mt-1 text-xs text-[#888888]">
                  Desde o início do SPEEK 49er.
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-xs uppercase tracking-wide text-[#888888]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Posts aprovados (mês)
                </span>
                <span
                  className="mt-2 text-2xl text-[#0A0A0A]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {approvedThisMonth}
                </span>
                <span className="mt-1 text-xs text-[#888888]">
                  Conteúdo já pronto para LinkedIn.
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-xs uppercase tracking-wide text-[#888888]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Posts pendentes (hoje)
                </span>
                <span
                  className="mt-2 text-2xl text-[#0A0A0A]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {pendingToday}
                </span>
                <span className="mt-1 text-xs text-[#888888]">
                  Aprovação em 30 segundos.
                </span>
              </div>
            </section>

            {/* POSTS PENDENTES ORGANIZADOS POR REUNIÃO */}
            <section className="mb-14">
              <h2
                className="mb-3 text-2xl tracking-wide text-[#0A0A0A]"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                POSTS AGUARDANDO APROVAÇÃO
              </h2>
              <p className="mb-6 text-[#0A0A0A]/80">
                Sua reunião de hoje gerou {pending.length} post(s). Qual você quer
                publicar?
              </p>

              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg
                    width="80"
                    height="70"
                    viewBox="0 0 32 28"
                    fill="none"
                    className="mb-6 opacity-40"
                  >
                    <rect
                      x="0"
                      y="18"
                      width="4"
                      height="10"
                      fill="#FF5A1F"
                      opacity="0.4"
                    />
                    <rect
                      x="7"
                      y="10"
                      width="4"
                      height="18"
                      fill="#FF5A1F"
                      opacity="0.6"
                    />
                    <rect
                      x="14"
                      y="4"
                      width="4"
                      height="24"
                      fill="#FF5A1F"
                      opacity="0.8"
                    />
                    <rect
                      x="21"
                      y="12"
                      width="4"
                      height="16"
                      fill="#FF5A1F"
                      opacity="0.6"
                    />
                    <rect
                      x="28"
                      y="20"
                      width="4"
                      height="8"
                      fill="#FF5A1F"
                      opacity="0.4"
                    />
                  </svg>
                  <p className="text-lg text-[#0A0A0A]">
                    Nenhuma reunião processada hoje.
                  </p>
                  <p
                    className="mt-2 font-mono text-sm text-[#888888]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    // AGUARDANDO TRANSCRIÇÕES...
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {pendingGroups.map(([meetingId, group]) => {
                    const meeting = group.meeting;
                    const pendingCount = group.posts.length;

                    return (
                      <section
                        key={meetingId}
                        className="rounded-2xl border border-[#888888]/20 bg-white/60 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                      >
                        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                          <div>
                            <h3
                              className="text-lg text-[#0A0A0A]"
                              style={{
                                fontFamily: '"Bebas Neue", sans-serif',
                                letterSpacing: "0.08em",
                              }}
                            >
                              {meeting?.title || "Reunião sem título"}
                            </h3>
                            {meeting?.meeting_date && (
                              <p className="text-sm text-[#888888]">
                                {formatMeetingDayLabel(meeting.meeting_date)}
                              </p>
                            )}
                          </div>
                          <span
                            className="inline-flex items-center rounded-full border border-[#FF5A1F]/40 bg-[#FF5A1F]/5 px-3 py-1 text-xs text-[#FF5A1F]"
                            style={{ fontFamily: '"JetBrains Mono", monospace' }}
                          >
                            {pendingCount} post
                            {pendingCount > 1 ? "s pendentes" : " pendente"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {group.posts.map((post) => {
                            const isExpanded = expandedPostIds.has(post.id);
                            return (
                              <article
                                key={post.id}
                                className="flex h-full flex-col rounded-xl border border-[#888888]/20 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                              >
                                <div
                                  className="mb-2 font-mono text-xs font-medium text-[#FF5A1F]"
                                  style={{
                                    fontFamily: '"JetBrains Mono", monospace',
                                  }}
                                >
                                  OPÇÃO{" "}
                                  {String(post.option_number).padStart(2, "0")}
                                </div>
                                <p
                                  className={`whitespace-pre-wrap text-sm leading-relaxed text-[#0A0A0A] ${
                                    isExpanded ? "" : "line-clamp-4"
                                  }`}
                                >
                                  {post.content}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(post.id)}
                                  className="mt-2 self-start text-xs text-[#FF5A1F] transition-colors hover:text-[#CC3D0A]"
                                  style={{
                                    fontFamily: '"JetBrains Mono", monospace',
                                  }}
                                >
                                  {isExpanded ? "ver menos" : "ver mais"}
                                </button>
                                {post.meeting?.meeting_date && (
                                  <p className="mt-3 text-xs text-[#888888]">
                                    Reunião:{" "}
                                    {formatDate(post.meeting.meeting_date)}
                                  </p>
                                )}
                                <div className="mt-4 flex gap-3 pt-2">
                                  <button
                                    onClick={() =>
                                      updateStatus(post.id, "approved")
                                    }
                                    disabled={updatingId === post.id}
                                    className="flex-1 rounded-lg bg-[#FF5A1F] px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#FF7A45] active:bg-[#CC3D0A] disabled:opacity-60"
                                    style={{
                                      fontFamily: '"DM Sans", sans-serif',
                                    }}
                                  >
                                    {updatingId === post.id
                                      ? "..."
                                      : "APROVAR"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatus(post.id, "rejected")
                                    }
                                    disabled={updatingId === post.id}
                                    className="flex-1 rounded-lg border border-[#888888] bg-transparent px-4 py-2 text-xs font-medium text-[#888888] transition-colors duration-200 hover:border-[#0A0A0A] hover:text-[#0A0A0A] disabled:opacity-60"
                                    style={{
                                      fontFamily: '"DM Sans", sans-serif',
                                    }}
                                  >
                                    REJEITAR
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </section>

            {/* POSTS APROVADOS */}
            {approved.length > 0 && (
              <section>
                <h2
                  className="mb-6 text-2xl tracking-wide text-[#0A0A0A]"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  APROVADOS
                </h2>
                <p className="mb-6 text-sm text-[#888888]">
                  Aprovação em 30 segundos.
                </p>
                <div className="space-y-4">
                  {approved.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-[#888888]/20 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                    >
                      <div
                        className="mb-2 inline-block rounded bg-green-600/15 px-2 py-0.5 font-mono text-xs font-medium text-green-700"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        APROVADO
                      </div>
                      <p className="line-clamp-3 whitespace-pre-wrap text-[#0A0A0A] text-sm leading-relaxed">
                        {post.content}
                      </p>
                      {post.meeting?.meeting_date && (
                        <p className="mt-3 text-xs text-[#888888]">
                          {formatDate(post.meeting.meeting_date)}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#888888]/20 py-6">
        <p
          className="text-center text-sm font-light text-[#888888]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Um produto de 49 Educação
        </p>
      </footer>
    </div>
  );
}
