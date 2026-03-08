// src/adapters/types.ts
import { PublishPayload, PublishResult, AdapterConfigField } from "@/types";

export interface PublishAdapter {
  id: string;
  name: string;
  description: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult>;
}
