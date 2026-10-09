import { MongoBinary } from "mongodb-memory-server";

// Test files run in parallel workers; on an empty cache each one starts its own
// mongod download into the same directory and they break each other's lockfile
// and rename. Fetching the binary once here, before any worker starts, leaves
// them a ready binary.
export default async function setup() {
  await MongoBinary.getPath();
}
