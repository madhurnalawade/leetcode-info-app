"use client";

import { FormEvent, useState } from "react";

type Skill = {
  tagName: string;
  problemsSolved: number;
};

type LeetCodeStats = {
  username: string;
  ranking: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalQuestions: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  skills: Skill[];
};

function CircleProgress({
  label,
  solved,
  total,
  colorClassName,
}: {
  label: string;
  solved: number;
  total: number;
  colorClassName: string;
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(solved / total, 1) : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-zinc-300 dark:stroke-zinc-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClassName}
        />
      </svg>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {solved} / {total}
      </p>
    </div>
  );
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<LeetCodeStats | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please enter a LeetCode username.");
      setStats(null);
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch(`/api/leetcode/${encodeURIComponent(trimmedUsername)}`);
    const payload = (await response.json()) as LeetCodeStats & { message?: string };

    if (!response.ok) {
      setStats(null);
      setError(payload.message ?? "Unable to fetch LeetCode profile.");
      setLoading(false);
      return;
    }

    setStats(payload);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 p-6 md:p-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold md:text-3xl">LeetCode Profile Insights</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter any public LeetCode username to view solved counts, ranking, and top skills.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. leetcode"
            className="h-11 flex-1 rounded-lg border border-zinc-300 px-3 text-sm outline-none ring-indigo-500 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="LeetCode username"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Loading..." : "Get Stats"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </section>

      {stats ? (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Username</dt>
                <dd className="font-medium">{stats.username}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Ranking</dt>
                <dd className="font-medium">{stats.ranking ?? "N/A"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Total)</dt>
                <dd className="font-medium">
                  {stats.totalSolved} / {stats.totalQuestions}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Easy)</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                  {stats.easySolved} / {stats.easyTotal}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Medium)</dt>
                <dd className="font-medium text-amber-600 dark:text-amber-400">
                  {stats.mediumSolved} / {stats.mediumTotal}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Hard)</dt>
                <dd className="font-medium text-rose-600 dark:text-rose-400">
                  {stats.hardSolved} / {stats.hardTotal}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Top Skills</h2>
            {stats.skills.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No skill data available.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {stats.skills.map((skill) => (
                  <li key={skill.tagName} className="flex items-center justify-between rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
                    <span>{skill.tagName}</span>
                    <span className="font-medium">{skill.problemsSolved}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {stats ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Solved Progress</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CircleProgress
              label="Total"
              solved={stats.totalSolved}
              total={stats.totalQuestions}
              colorClassName="stroke-indigo-500"
            />
            <CircleProgress
              label="Easy"
              solved={stats.easySolved}
              total={stats.easyTotal}
              colorClassName="stroke-emerald-500"
            />
            <CircleProgress
              label="Medium"
              solved={stats.mediumSolved}
              total={stats.mediumTotal}
              colorClassName="stroke-amber-500"
            />
            <CircleProgress
              label="Hard"
              solved={stats.hardSolved}
              total={stats.hardTotal}
              colorClassName="stroke-rose-500"
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
