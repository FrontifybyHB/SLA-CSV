export type CanonicalStatus = "UP" | "DOWN" | "UNKNOWN_EVIDENCE";

export interface StatusEvidence {
  status: CanonicalStatus;
  issueCode?: "INVALID_HTTP_STATUS" | "UNRECOGNIZED_STATUS" | "EMPTY_STATUS";
  message?: string;
}

export class StatusClassifier {
  private readonly positiveTokens = new Set([
    "up",
    "success",
    "pass",
    "ok",
    "healthy",
    "true",
    "1",
  ]);

  private readonly negativeTokens = new Set([
    "down",
    "fail",
    "failed",
    "error",
    "unavailable",
    "false",
    "0",
  ]);

  constructor() {}

  classify(raw: string): StatusEvidence {
    const trimmed = (raw ?? "").trim().toLowerCase();

    if (trimmed === "") {
      return {
        status: "UNKNOWN_EVIDENCE",
        issueCode: "EMPTY_STATUS",
        message: "Status value is empty",
      };
    }

    if (this.positiveTokens.has(trimmed)) {
      return { status: "UP" };
    }

    if (this.negativeTokens.has(trimmed)) {
      return { status: "DOWN" };
    }

    if (trimmed === "unknown") {
      return { status: "UNKNOWN_EVIDENCE" };
    }

    // Check if numeric HTTP code.
    // Spec: 2xx => UP, 3xx-5xx => DOWN, anything else => UNKNOWN.
    if (/^\d+$/.test(trimmed)) {
      const code = Number.parseInt(trimmed, 10);
      if (code >= 200 && code <= 299) {
        return { status: "UP" };
      }
      if (code >= 300 && code <= 599) {
        return { status: "DOWN" };
      }
      // Outside standard HTTP status range (e.g. 999, 12, 700)
      return {
        status: "UNKNOWN_EVIDENCE",
        issueCode: "INVALID_HTTP_STATUS",
        message: `HTTP status code ${code} is outside standard range (100-599)`,
      };
    }

    // Any other unrecognized non-numeric token
    return {
      status: "UNKNOWN_EVIDENCE",
      issueCode: "UNRECOGNIZED_STATUS",
      message: `Unrecognized status string: "${raw}"`,
    };
  }
}
