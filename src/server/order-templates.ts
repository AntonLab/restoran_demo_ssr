import { templateSchema, type Contact } from "@/lib/order-schemas";
import { fieldFailure, zodFailure, type AccountFailure } from "@/server/accounts";
import { connectDb } from "@/server/db";
import { OrderTemplate } from "@/server/models/order-template";
import { parseObjectId } from "@/server/queries/menu";

export const TEMPLATE_LIMIT = 5;

export type TemplateData = {
  id: string;
  name: string;
  phone: string;
  address: string;
  lastUsedAt: Date;
};
export type TemplateResult = { ok: true } | AccountFailure;

const NOT_FOUND: AccountFailure = { ok: false, error: "Template not found." };
const DUPLICATE = fieldFailure({ address: ["You already have a template with these details."] });

export async function listTemplates(userId: string): Promise<TemplateData[]> {
  await connectDb();
  const rows = await OrderTemplate.find({ userId }).sort({ lastUsedAt: -1, _id: -1 }).lean();
  return rows.map((t) => ({
    id: String(t._id),
    name: t.name,
    phone: t.phone,
    address: t.address,
    lastUsedAt: t.lastUsedAt,
  }));
}

export async function createTemplate(userId: string, input: unknown): Promise<TemplateResult> {
  await connectDb();
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return zodFailure(parsed.error);
  if ((await OrderTemplate.countDocuments({ userId })) >= TEMPLATE_LIMIT) {
    return { ok: false, error: "Template limit reached." };
  }
  if (await OrderTemplate.exists({ userId, ...parsed.data })) return DUPLICATE;
  await OrderTemplate.create({ userId, ...parsed.data, lastUsedAt: new Date() });
  return { ok: true };
}

export async function updateTemplate(
  userId: string,
  rawId: string,
  input: unknown,
): Promise<TemplateResult> {
  await connectDb();
  const id = parseObjectId(rawId);
  if (!id) return NOT_FOUND;
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return zodFailure(parsed.error);
  if (await OrderTemplate.exists({ userId, ...parsed.data, _id: { $ne: id } })) return DUPLICATE;
  const res = await OrderTemplate.updateOne({ _id: id, userId }, parsed.data);
  return res.matchedCount ? { ok: true } : NOT_FOUND;
}

export async function deleteTemplate(userId: string, rawId: string): Promise<TemplateResult> {
  await connectDb();
  const id = parseObjectId(rawId);
  if (!id) return NOT_FOUND;
  const res = await OrderTemplate.deleteOne({ _id: id, userId });
  return res.deletedCount ? { ok: true } : NOT_FOUND;
}

export async function recordCheckoutTemplate(
  userId: string,
  contact: Contact,
  save: boolean,
  now = new Date(),
): Promise<void> {
  await connectDb();
  const res = await OrderTemplate.updateOne({ userId, ...contact }, { lastUsedAt: now });
  if (res.matchedCount || !save) return;
  if ((await OrderTemplate.countDocuments({ userId })) >= TEMPLATE_LIMIT) return;
  await OrderTemplate.create({ userId, ...contact, lastUsedAt: now });
}
