export type UseCase =
  | "Static Website"
  | "Dynamic Web App"
  | "REST API"
  | "Small Internal Tool"
  | "Portfolio Website"
  | "MVP Startup App";

export type FrontendOption = "None" | "S3 Static Website" | "EC2-hosted frontend";

export type CdnOption = "None" | "CloudFront";

export type ApiLayerOption = "None" | "API Gateway" | "ALB";

export type ComputeOption = "None" | "Lambda" | "EC2";

export type DatabaseOption = "None" | "DynamoDB" | "RDS";

export type TrafficLevel = "Low" | "Medium" | "High";

export type PriorityOption =
  | "Lowest Cost"
  | "Simplicity"
  | "Scalability"
  | "Balanced";

export type ValidationStatus = "Valid" | "Valid with warnings" | "Not recommended";

export type ScoreLevel = "Good" | "Moderate" | "Risk";

export interface ArchitectureInput {
  useCase: UseCase;
  frontend: FrontendOption;
  cdn: CdnOption;
  apiLayer: ApiLayerOption;
  compute: ComputeOption;
  database: DatabaseOption;
  traffic: TrafficLevel;
  priority: PriorityOption;
}

export interface ValidationScores {
  security: ScoreLevel;
  cost: ScoreLevel;
  scalability: ScoreLevel;
  complexity: ScoreLevel;
}

export interface ValidationResult {
  status: ValidationStatus;
  summary: string;
  scores: ValidationScores;
  warnings: string[];
  suggestions: string[];
}
