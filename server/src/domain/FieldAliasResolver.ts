export type CanonicalField = "timestamp" | "service" | "status" | "latency" | "agent";

export interface HeaderMapping {
  timestampIdx: number;
  serviceIdx: number;
  statusIdx: number;
  latencyIdx: number;
  agentIdx: number;
}

export class FieldAliasResolver {
  private readonly aliasMap: Record<string, CanonicalField> = {
    // timestamp
    timestamp: "timestamp",
    time: "timestamp",
    ts: "timestamp",
    phase: "timestamp",
    datetime: "timestamp",
    date: "timestamp",

    // service
    service: "service",
    target: "service",
    service_name: "service",
    servicename: "service",

    // status
    status: "status",
    result: "status",
    state: "status",
    availability: "status",

    // latency
    latency: "latency",
    latency_ms: "latency",
    latencyms: "latency",
    "latency (ms)": "latency",
    response_time_ms: "latency",
    responsetimems: "latency",
    response: "latency",
    response_time: "latency",
    responsems: "latency",

    // agent
    agent: "agent",
    agent_id: "agent",
    agentid: "agent",
    "agent id": "agent",
    region: "agent",
    server: "agent",
    host: "agent",
    node: "agent",
  };

  constructor() {}

  resolve(header: string): CanonicalField | null {
    const cleaned = header.trim().toLowerCase();
    return this.aliasMap[cleaned] ?? null;
  }

  resolveHeaderMap(headers: string[]): HeaderMapping {
    let timestampIdx = -1;
    let serviceIdx = -1;
    let statusIdx = -1;
    let latencyIdx = -1;
    let agentIdx = -1;

    for (let i = 0; i < headers.length; i++) {
      const canonical = this.resolve(headers[i]);
      if (!canonical) continue;
      if (canonical === "timestamp" && timestampIdx === -1) timestampIdx = i;
      else if (canonical === "service" && serviceIdx === -1) serviceIdx = i;
      else if (canonical === "status" && statusIdx === -1) statusIdx = i;
      else if (canonical === "latency" && latencyIdx === -1) latencyIdx = i;
      else if (canonical === "agent" && agentIdx === -1) agentIdx = i;
    }

    return {
      timestampIdx,
      serviceIdx,
      statusIdx,
      latencyIdx,
      agentIdx,
    };
  }
}
