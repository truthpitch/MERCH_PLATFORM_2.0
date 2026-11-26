// GET /admin/social/connect/instagram: sends the admin to Instagram to allow access.
import { startConnect } from "@/lib/social/connect";

export const dynamic = "force-dynamic";

export const GET = () => startConnect("INSTAGRAM");
