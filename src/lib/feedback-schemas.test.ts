import { expect, test } from "vitest";
import { complaintInputSchema, reviewInputSchema } from "@/lib/feedback-schemas";

const errors = (schema: typeof reviewInputSchema | typeof complaintInputSchema, input: unknown) => {
  const res = schema.safeParse(input);
  return res.success ? {} : Object.fromEntries(res.error.issues.map((i) => [i.path[0], i.message]));
};

const review = { dishesRating: "5", serviceRating: "4", text: "Lovely" };

test.each([
  [{ text: "  " }, { text: "Please write your review." }],
  [{ text: "x".repeat(1001) }, { text: "Keep it under 1000 characters." }],
  [{ dishesRating: "" }, { dishesRating: "Choose a rating." }],
  [{ serviceRating: "abc" }, { serviceRating: "Choose a rating." }],
  [{ dishesRating: "6" }, { dishesRating: "Choose a rating." }],
  [{ contact: "x".repeat(201) }, { contact: "Keep it under 200 characters." }],
])("review %j gives readable messages", (bad, expected) => {
  expect(errors(reviewInputSchema, { ...review, ...bad })).toEqual(expected);
});

test("review with a missing rating asks to choose one", () => {
  expect(errors(reviewInputSchema, { serviceRating: "4", text: "ok" })).toEqual({
    dishesRating: "Choose a rating.",
  });
});

test.each([
  [{ text: "" }, { text: "Please describe the problem." }],
  [{ text: "x".repeat(1001) }, { text: "Keep it under 1000 characters." }],
  [{ contact: " " }, { contact: "Please leave a phone or email so we can reply." }],
  [{ contact: "x".repeat(201) }, { contact: "Keep it under 200 characters." }],
])("complaint %j gives readable messages", (bad, expected) => {
  expect(errors(complaintInputSchema, { text: "Cold soup", contact: "a@b.c", ...bad })).toEqual(
    expected,
  );
});
