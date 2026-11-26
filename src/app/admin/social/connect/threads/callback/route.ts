// GET /admin/social/connect/threads/callback: Threads sends the admin back here with a code.
// Swaps it for a long-lived token, stores it encrypted and returns to the accounts page.
import { finishConnect } from "@/lib/social/connect";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => finishConnect("THREADS", request);
