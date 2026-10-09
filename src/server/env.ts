import { z } from "zod";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema);

const schema = z.object({
  MONGODB_URI: optional(z.string().default("mongodb://127.0.0.1:27017/restoran_demo")),
  ADMIN_EMAIL: optional(z.email().optional()),
  ADMIN_PASSWORD: optional(z.string().optional()),
  APP_BASE_URL: optional(z.string().default("http://localhost:3000")),
  MAIL_DELIVERY: optional(z.enum(["log", "smtp"]).default("log")),
  UPLOADS_DIR: optional(z.string().optional()),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return schema.parse(source);
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
