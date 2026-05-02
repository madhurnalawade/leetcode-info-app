import { NextResponse } from "next/server";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

const problemsQuery = `
  query problemsBySkill($skip: Int!, $limit: Int!, $filters: QuestionFilterInput) {
    problemsetQuestionListV2(
      skip: $skip
      limit: $limit
      filters: $filters
      categorySlug: ""
    ) {
      totalLength
      questions {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
        }
      }
    }
  }
`;

type Problem = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: Array<{ name: string }>;
};

type ProblemsResponse = {
  data?: {
    problemsetQuestionListV2?: {
      totalLength: number;
      questions: Problem[];
    };
  };
  errors?: Array<{ message?: string }>;
};

const difficultyToEnum: Record<string, "EASY" | "MEDIUM" | "HARD"> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
};

function toTopicSlug(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const skillSlug = searchParams.get("skillSlug") ?? (skill ? toTopicSlug(skill) : null);
  const difficulty = searchParams.get("difficulty");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5"), 20);

  if (!skill || !skillSlug || !difficulty) {
    return NextResponse.json(
      { message: "skill, skillSlug and difficulty parameters are required" },
      { status: 400 }
    );
  }

  if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
    return NextResponse.json(
      { message: "difficulty must be Easy, Medium, or Hard" },
      { status: 400 }
    );
  }

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query: problemsQuery,
      variables: {
        skip: 0,
        limit: limit * 3,
        filters: {
          filterCombineType: "ALL",
          topicFilter: {
            topicSlugs: [skillSlug],
            operator: "IS",
          },
          difficultyFilter: {
            difficulties: [difficultyToEnum[difficulty]],
            operator: "IS",
          },
        },
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ProblemsResponse;
  if (!response.ok) {
    const upstreamMessage = payload.errors?.[0]?.message ?? "LeetCode is unavailable";
    return NextResponse.json({ message: upstreamMessage }, { status: 502 });
  }

  const errorMessage = payload.errors?.[0]?.message;
  if (errorMessage) {
    return NextResponse.json({ message: errorMessage }, { status: 502 });
  }

  const questions = payload.data?.problemsetQuestionListV2?.questions ?? [];
  const shuffled = questions
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return NextResponse.json(
    {
      skill,
      difficulty,
      problems: shuffled.map((q) => ({
        id: q.questionFrontendId,
        title: q.title,
        slug: q.titleSlug,
        difficulty: q.difficulty,
      })),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=1200",
      },
    }
  );
}
