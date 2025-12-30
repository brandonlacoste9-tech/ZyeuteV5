export type BeeType =
  | "finance"
  | "security"
  | "joual"
  | "poutine"
  | "hockey"
  | "region";

export interface BeeAgent {
  id: string;
  type: BeeType;
  name: string;
  status: "idle" | "thinking" | "working" | "offline";
  specialty: string;
}

export interface SwarmTask {
  id: string;
  description: string;
  assignedTo: BeeType;
  priority: "low" | "normal" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: any;
}

export interface SwarmResponse {
  bee: BeeAgent;
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}
