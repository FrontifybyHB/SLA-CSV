export type CanonicalField = "timestamp" | "service" | "status" | "latency" | "agent" | "region";

export interface HeaderMapping {
  timestampIdx: number;
  serviceIdx: number;
  statusIdx: number;
  latencyIdx: number;
  agentIdx: number;
  regionIdx: number;
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
    checked_at: "timestamp",
    checkedat: "timestamp",
    created_at: "timestamp",

    // service
    service: "service",
    target: "service",
    service_name: "service",
    servicename: "service",
    "service name": "service",
    svc: "service",
    serviceid: "service",
    service_id: "service",
    endpoint: "service",
    check: "service",
    monitor: "service",

    // status — numeric codes arrive here too (e.g. status_code, http_status)
    status: "status",
    result: "status",
    state: "status",
    availability: "status",
    status_code: "status",
    statuscode: "status",
    "status code": "status",
    http_status: "status",
    httpstatus: "status",
    http_code: "status",
    httpcode: "status",
    code: "status",
    statuscodevalue: "status",

    // latency
    latency: "latency",
    latency_ms: "latency",
    latencyms: "latency",
    "latency (ms)": "latency",
    response_time_ms: "latency",
    responsetimems: "latency",
    response: "latency",
    response_time: "latency",
    responsetime: "latency",
    responsems: "latency",
    response_ms: "latency",
    responsetimeseconds: "latency",
    duration: "latency",
    duration_ms: "latency",
    elapsed: "latency",
    elapsed_ms: "latency",

    // agent — the probe/server that performed the check.
    // NOTE: `region`/`location` are NOT agents; they are stored separately.
    agent: "agent",
    agent_id: "agent",
    agentid: "agent",
    "agent id": "agent",
    server: "agent",
    host: "agent",
    node: "agent",
    probe: "agent",
    probe_id: "agent",
    checker: "agent",
    monitor_id: "agent",

    // region — where the check ran / target region (stored, never an agent)
    region: "region",
    loc: "region",
    location: "region",
    az: "region",
    zone: "region",
    datacenter: "region",
    dc: "region",
    site: "region",
    pop: "region",
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
    let regionIdx = -1;

    for (let i = 0; i < headers.length; i++) {
      const canonical = this.resolve(headers[i]);
      if (!canonical) continue;
      if (canonical === "timestamp" && timestampIdx === -1) timestampIdx = i;
      else if (canonical === "service" && serviceIdx === -1) serviceIdx = i;
      else if (canonical === "status" && statusIdx === -1) statusIdx = i;
      else if (canonical === "latency" && latencyIdx === -1) latencyIdx = i;
      else if (canonical === "agent" && agentIdx === -1) agentIdx = i;
      else if (canonical === "region" && regionIdx === -1) regionIdx = i;
    }

    return {
      timestampIdx,
      serviceIdx,
      statusIdx,
      latencyIdx,
      agentIdx,
      regionIdx,
    };
  }
}
