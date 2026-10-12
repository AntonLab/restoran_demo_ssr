import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <output className="text-muted-foreground mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-12">
      <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span>Loading...</span>
    </output>
  );
}
