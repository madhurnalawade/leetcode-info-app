import { NextResponse } from "next/server";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

const profileQuery = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
    }
  }
`;

type DifficultyStat = {
  difficulty: string;
  count: number;
};

type SkillStat = {
  tagName: string;
  problemsSolved: number;
};

type GraphQlResponse = {
  data?: {
    matchedUser?: {
      username: string;
      profile?: {
        ranking?: number;
      };
      submitStats?: {
        acSubmissionNum?: DifficultyStat[];
      };
      tagProblemCounts?: {
        advanced?: SkillStat[];
        intermediate?: SkillStat[];
        fundamental?: SkillStat[];
      };
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

function getSolvedCount(stats: DifficultyStat[] | undefined, difficulty: string): number {
  return stats?.find((item) => item.difficulty === difficulty)?.count ?? 0;
}

function getTopSkills(tagProblemCounts: {
  advanced?: SkillStat[];
  intermediate?: SkillStat[];
  fundamental?: SkillStat[];
}): SkillStat[] {
  const combined = [
    ...(tagProblemCounts.fundamental ?? []),
    ...(tagProblemCounts.intermediate ?? []),
    ...(tagProblemCounts.advanced ?? []),
  ];

  return combined
    .filter((skill) => skill.problemsSolved > 0)
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 12);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  const trimmedUsername = username.trim();

  if (!/^[a-zA-Z0-9_-]{1,30}$/.test(trimmedUsername)) {
    return NextResponse.json(
      { message: "Please enter a valid LeetCode username." },
      { status: 400 },
    );
  }

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query: profileQuery,
      variables: {
        username: trimmedUsername,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "LeetCode is unavailable right now. Please try again shortly." },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as GraphQlResponse;
  const errorMessage = payload.errors?.[0]?.message;
  if (errorMessage) {
    return NextResponse.json({ message: errorMessage }, { status: 502 });
  }

  const user = payload.data?.matchedUser;
  if (!user) {
    return NextResponse.json(
      { message: "LeetCode user not found." },
      { status: 404 },
    );
  }

  const difficultyStats = user.submitStats?.acSubmissionNum;
  const easySolved = getSolvedCount(difficultyStats, "Easy");
  const mediumSolved = getSolvedCount(difficultyStats, "Medium");
  const hardSolved = getSolvedCount(difficultyStats, "Hard");
  const totalSolved = getSolvedCount(difficultyStats, "All");

  const skills = getTopSkills(user.tagProblemCounts ?? {});

  return NextResponse.json(
    {
      username: user.username,
      ranking: user.profile?.ranking ?? null,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      skills,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
