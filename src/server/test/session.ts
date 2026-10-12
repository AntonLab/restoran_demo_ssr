import { vi } from "vitest";
import { getSession } from "@/server/auth/session";

// The calling file keeps its own vi.mock of "@/server/auth/session", which Vitest hoists per file.
export const asSession = (
  role: "user" | "admin" | null,
  id = "507f1f77bcf86cd799439011",
  sessionId = "s",
) =>
  vi
    .mocked(getSession)
    .mockResolvedValue(role ? ({ sessionId, user: { id, role } } as never) : null);
