"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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
  const size = 110;
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

function DiffText({
  diff,
  positiveLabel,
  negativeLabel,
}: {
  diff: number;
  positiveLabel: string;
  negativeLabel: string;
}) {
  if (diff === 0) {
    return <span className="text-xs text-zinc-500">0 (same)</span>;
  }

  const positive = diff > 0;
  const color = positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  const label = positive ? positiveLabel : negativeLabel;
  const signed = positive ? `+${diff}` : `${diff}`;

  return <span className={`text-xs font-medium ${color}`}>{signed} ({label})</span>;
}

function skillCountByTag(skills: Skill[]): Map<string, number> {
  return new Map(skills.map((skill) => [skill.tagName, skill.problemsSolved]));
}

export default function CompareClient({ initialUser1 }: { initialUser1: string }) {
  const [user1, setUser1] = useState(initialUser1);
  const [user2, setUser2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats1, setStats1] = useState<LeetCodeStats | null>(null);
  const [stats2, setStats2] = useState<LeetCodeStats | null>(null);

  async function fetchStats(inputUsername: string): Promise<LeetCodeStats & { message?: string }> {
    const response = await fetch(`/api/leetcode/${encodeURIComponent(inputUsername)}`);
    const payload = (await response.json()) as LeetCodeStats & { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "Unable to fetch LeetCode profile.");
    }

    return payload;
  }

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUser1 = user1.trim();
    const trimmedUser2 = user2.trim();

    if (!trimmedUser1 || !trimmedUser2) {
      setError("Please enter both usernames.");
      return;
    }

    if (trimmedUser1.toLowerCase() === trimmedUser2.toLowerCase()) {
      setError("Please enter two different usernames.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [first, second] = await Promise.all([fetchStats(trimmedUser1), fetchStats(trimmedUser2)]);
      setStats1(first);
      setStats2(second);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unable to compare profiles.";
      setStats1(null);
      setStats2(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const comparedSkillMap = useMemo(() => skillCountByTag(stats2?.skills ?? []), [stats2]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold md:text-3xl">Compare LeetCode Users</h1>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Back
          </Link>
        </div>

        <form onSubmit={handleCompare} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <input
            value={user1}
            onChange={(event) => setUser1(event.target.value)}
            placeholder="User 1 username"
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none ring-indigo-500 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="User 1 username"
          />
          <input
            value={user2}
            onChange={(event) => setUser2(event.target.value)}
            placeholder="User 2 username"
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none ring-indigo-500 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="User 2 username"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Comparing..." : "Compare"}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </section>

      {stats1 && stats2 ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">{stats1.username} Progress</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CircleProgress
                  label="Total"
                  solved={stats1.totalSolved}
                  total={stats1.totalQuestions}
                  colorClassName="stroke-indigo-500"
                />
                <CircleProgress
                  label="Easy"
                  solved={stats1.easySolved}
                  total={stats1.easyTotal}
                  colorClassName="stroke-emerald-500"
                />
                <CircleProgress
                  label="Medium"
                  solved={stats1.mediumSolved}
                  total={stats1.mediumTotal}
                  colorClassName="stroke-amber-500"
                />
                <CircleProgress
                  label="Hard"
                  solved={stats1.hardSolved}
                  total={stats1.hardTotal}
                  colorClassName="stroke-rose-500"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">{stats2.username} Progress</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CircleProgress
                  label="Total"
                  solved={stats2.totalSolved}
                  total={stats2.totalQuestions}
                  colorClassName="stroke-indigo-500"
                />
                <CircleProgress
                  label="Easy"
                  solved={stats2.easySolved}
                  total={stats2.easyTotal}
                  colorClassName="stroke-emerald-500"
                />
                <CircleProgress
                  label="Medium"
                  solved={stats2.mediumSolved}
                  total={stats2.mediumTotal}
                  colorClassName="stroke-amber-500"
                />
                <CircleProgress
                  label="Hard"
                  solved={stats2.hardSolved}
                  total={stats2.hardTotal}
                  colorClassName="stroke-rose-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Comparing <span className="font-medium">{stats1.username}</span> (user1) with{" "}
              <span className="font-medium">{stats2.username}</span> (user2)
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Ranking</dt>
                <dd className="text-right">
                  <div className="font-medium">
                    {stats1.ranking ?? "N/A"} vs {stats2.ranking ?? "N/A"}
                  </div>
                  {stats1.ranking !== null && stats2.ranking !== null ? (
                    <DiffText
                      diff={stats2.ranking - stats1.ranking}
                      positiveLabel="better rank for user1"
                      negativeLabel="worse rank for user1"
                    />
                  ) : null}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Total)</dt>
                <dd className="text-right">
                  <div className="font-medium">
                    {stats1.totalSolved} vs {stats2.totalSolved}
                  </div>
                  <DiffText
                    diff={stats1.totalSolved - stats2.totalSolved}
                    positiveLabel="more solved by user1"
                    negativeLabel="less solved by user1"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Easy)</dt>
                <dd className="text-right">
                  <div className="font-medium">
                    {stats1.easySolved} vs {stats2.easySolved}
                  </div>
                  <DiffText
                    diff={stats1.easySolved - stats2.easySolved}
                    positiveLabel="more solved by user1"
                    negativeLabel="less solved by user1"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Medium)</dt>
                <dd className="text-right">
                  <div className="font-medium">
                    {stats1.mediumSolved} vs {stats2.mediumSolved}
                  </div>
                  <DiffText
                    diff={stats1.mediumSolved - stats2.mediumSolved}
                    positiveLabel="more solved by user1"
                    negativeLabel="less solved by user1"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Solved (Hard)</dt>
                <dd className="text-right">
                  <div className="font-medium">
                    {stats1.hardSolved} vs {stats2.hardSolved}
                  </div>
                  <DiffText
                    diff={stats1.hardSolved - stats2.hardSolved}
                    positiveLabel="more solved by user1"
                    negativeLabel="less solved by user1"
                  />
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Skill Differences (user1 - user2)</h2>
            {stats1.skills.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No skill data available.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {stats1.skills.map((skill) => (
                  <li
                    key={skill.tagName}
                    className="flex items-center justify-between rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-900"
                  >
                    <span>{skill.tagName}</span>
                    <span className="text-right">
                      <span className="block font-medium">
                        {skill.problemsSolved} vs {comparedSkillMap.get(skill.tagName) ?? 0}
                      </span>
                      <DiffText
                        diff={skill.problemsSolved - (comparedSkillMap.get(skill.tagName) ?? 0)}
                        positiveLabel="more solved by user1"
                        negativeLabel="less solved by user1"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
