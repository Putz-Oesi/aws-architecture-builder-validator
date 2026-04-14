import type {
  ApiLayerOption,
  CdnOption,
  ComputeOption,
  DatabaseOption,
  FrontendOption,
  PriorityOption,
  TrafficLevel,
  UseCase,
} from "../types/architecture";

export const useCaseOptions: UseCase[] = [
  "Static Website",
  "Dynamic Web App",
  "REST API",
  "Small Internal Tool",
  "Portfolio Website",
  "MVP Startup App",
];

export const frontendOptions: FrontendOption[] = [
  "None",
  "S3 Static Website",
  "EC2-hosted frontend",
];

export const cdnOptions: CdnOption[] = ["None", "CloudFront"];

export const apiLayerOptions: ApiLayerOption[] = [
  "None",
  "API Gateway",
  "ALB",
];

export const computeOptions: ComputeOption[] = ["None", "Lambda", "EC2"];

export const databaseOptions: DatabaseOption[] = ["None", "DynamoDB", "RDS"];

export const trafficOptions: TrafficLevel[] = ["Low", "Medium", "High"];

export const priorityOptions: PriorityOption[] = [
  "Lowest Cost",
  "Simplicity",
  "Scalability",
  "Balanced",
];
