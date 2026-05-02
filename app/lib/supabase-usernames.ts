const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseRpcUrl(functionName: string): string | null {
  if (!SUPABASE_URL) {
    return null;
  }

  return `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/rpc/${functionName}`;
}

export function getRequesterIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function recordValidLeetCodeUsername({
  ipAddress,
  username,
}: {
  ipAddress: string;
  username: string;
}) {
  const rpcUrl = getSupabaseRpcUrl("record_valid_leetcode_username");

  if (!rpcUrl || !SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_ip_address: ipAddress,
      p_username: username,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase username record failed: ${message}`);
  }
}
