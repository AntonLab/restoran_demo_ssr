import { connectDb } from "@/server/db";
import { Counter } from "@/server/models/counter";

const DUPLICATE_KEY = 11000;

export async function nextNumber(key: string, retry = true): Promise<number> {
  await connectDb();
  try {
    const doc = await Counter.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    return doc.value;
  } catch (error) {
    // Two concurrent upserts of a new key race on the unique index; the loser retries as a plain update.
    if (retry && (error as { code?: number }).code === DUPLICATE_KEY) return nextNumber(key, false);
    throw error;
  }
}
