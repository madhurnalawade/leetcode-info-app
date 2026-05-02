"use client";

import { useState } from "react";

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
};

type RecommendationsModalProps = {
  username: string;
  skills: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  onClose: () => void;
};

export default function RecommendationsModal({
  username,
  skills,
  onClose,
}: RecommendationsModalProps) {
  const sortedSkills = [...skills].sort((a, b) => b.problemsSolved - a.problemsSolved);
  const strongCount = Math.ceil(sortedSkills.length / 2);
  const strongSkills = sortedSkills.slice(0, strongCount);
  const weakSkills = sortedSkills.slice(strongCount);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [loading, setLoading] = useState(false);
  const [problemsBySkill, setProblemsBySkill] = useState<
    Array<{ skill: string; problems: Problem[] }>
  >([]);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  function getSkillKey(skill: { tagName: string; tagSlug: string }) {
    return skill.tagSlug || skill.tagName;
  }

  function toggleSkill(skillKey: string) {
    setSelectedSkills((current) =>
      current.includes(skillKey) ? current.filter((s) => s !== skillKey) : [...current, skillKey],
    );
  }

  async function handleFetch() {
    if (selectedSkills.length === 0 || !selectedDifficulty) {
      setError("Please select at least one topic and a difficulty.");
      return;
    }

    setLoading(true);
    setError("");
    setProblemsBySkill([]);

    try {
      const responses = await Promise.all(
            selectedSkills.map(async (skillKey) => {
              const skillObj = skills.find((s) => getSkillKey(s) === skillKey);
              const skillName = skillObj?.tagName ?? skillKey;
              const skillSlug = skillObj?.tagSlug ?? skillKey;
              const params = new URLSearchParams({
                skill: skillName,
                skillSlug,
                difficulty: selectedDifficulty,
                limit: "4",
              });

              const response = await fetch(`/api/problems?${params.toString()}`);
              const data = (await response.json()) as { problems?: Problem[]; message?: string };

              if (!response.ok) {
                throw new Error(data.message ?? "Failed to fetch problems");
              }

              return {
                skill: skillName,
                problems: data.problems ?? [],
              };
            }),
      );

      setProblemsBySkill(responses);
      setFetched(true);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error fetching problems.");
      setProblemsBySkill([]);
    } finally {
      setLoading(false);
    }
  }

  const difficultyColor: Record<string, string> = {
    Easy: "text-emerald-600 dark:text-emerald-400",
    Medium: "text-amber-600 dark:text-amber-400",
    Hard: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Revise Topics</h2>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {username}: choose topics from weak and strong skills.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Weak Topics</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(weakSkills.length > 0 ? weakSkills : strongSkills).map((skill) => {
                const skillKey = getSkillKey(skill);
                const isSelected = selectedSkills.includes(skillKey);
                return (
                  <button
                    key={`weak-${skillKey}`}
                    onClick={() => toggleSkill(skillKey)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="block truncate">{skill.tagName}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {skill.problemsSolved} solved
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Strong Topics</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {strongSkills.map((skill) => {
                const skillKey = getSkillKey(skill);
                const isSelected = selectedSkills.includes(skillKey);
                return (
                  <button
                    key={`strong-${skillKey}`}
                    onClick={() => toggleSkill(skillKey)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="block truncate">{skill.tagName}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {skill.problemsSolved} solved
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Difficulty</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`rounded-lg py-2 px-3 text-sm font-medium transition ${
                    selectedDifficulty === diff
                      ? `${difficultyColor[diff]} bg-zinc-100 dark:bg-zinc-800`
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <button
            onClick={handleFetch}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-70"
          >
            {loading ? "Fetching..." : "Get Problems"}
          </button>
        </div>

        {problemsBySkill.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Recommended Problems</h3>
            <div className="mt-3 max-h-80 space-y-4 overflow-y-auto">
              {problemsBySkill.map((skillGroup) => (
                <div key={skillGroup.skill}>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {skillGroup.skill}
                  </h4>
                  {skillGroup.problems.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {skillGroup.problems.map((problem) => (
                        <li
                          key={`${skillGroup.skill}-${problem.id}-${problem.slug}`}
                          className="flex items-center justify-between rounded-md bg-zinc-100 p-3 dark:bg-zinc-800"
                        >
                          <div className="min-w-0 flex-1">
                            <a
                              href={`https://leetcode.com/problems/${problem.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              {problem.id}. {problem.title}
                            </a>
                          </div>
                          <span
                            className={`ml-2 shrink-0 text-xs font-medium ${difficultyColor[problem.difficulty]}`}
                          >
                            {problem.difficulty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      No problems found for this topic at selected difficulty.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : fetched && problemsBySkill.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            No problems found for selected topics and difficulty.
          </p>
        ) : null}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}
