import { capabilities } from "@/lib/academy-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(capabilities(), {
    headers: { "Cache-Control": "no-store" },
  });
}
