// GET /admin/social/connect/threads: sends the admin to Threads to allow access.
import { startConnect } from "@/lib/social/connect";

export const dynamic = "force-dynamic";

export const GET = () => startConnect("THREADS");
