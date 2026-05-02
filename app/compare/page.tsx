import CompareClient from "./compare-client";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ user1?: string }>;
}) {
  const params = await searchParams;
  return <CompareClient initialUser1={params.user1 ?? ""} />;
}
