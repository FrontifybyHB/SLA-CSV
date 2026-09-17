import { createHash } from "node:crypto";

export class FileHasher {
  constructor() {}

  sha256(bytes: Buffer): string {
    return createHash("sha256").update(bytes).digest("hex");
  }
}
