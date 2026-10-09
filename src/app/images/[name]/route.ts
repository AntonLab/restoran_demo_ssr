import { readUpload } from "@/server/images";

export async function GET(_request: Request, ctx: RouteContext<"/images/[name]">) {
  const { name } = await ctx.params;
  const file = await readUpload(name);
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      // Names are unique per upload, so a stored file never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
