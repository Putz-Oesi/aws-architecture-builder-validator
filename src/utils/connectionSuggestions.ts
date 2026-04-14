export function getSuggestedFixes(
  sourceLabel: string,
  targetLabel: string
): string[] {
  const connection = `${sourceLabel}->${targetLabel}`;

  const specificSuggestions: Record<string, string[]> = {
    "CloudFront->DynamoDB": [
      "CloudFront → API Gateway → Lambda → DynamoDB",
      "ALB → EC2 → DynamoDB",
      "CloudFront → S3 for static content, and Lambda → DynamoDB for data access",
    ],
    "CloudFront->EC2": [
      "ALB → EC2 for a classic web application entry point",
      "CloudFront → S3 for static delivery",
      "CloudFront → API Gateway if the edge layer should front an API",
    ],
    "API Gateway->RDS": [
      "API Gateway → Lambda → RDS",
      "ALB → EC2 → RDS",
      "API Gateway → Lambda for application logic before database access",
    ],
    "Lambda->EC2": [
      "Lambda → S3 if the function needs object storage",
      "Lambda → DynamoDB for serverless data access",
      "ALB → EC2 if EC2 is meant to handle incoming application requests",
    ],
    "S3->EC2": [
      "EC2 → S3 if EC2 consumes files or artifacts from object storage",
      "S3 → Lambda if you mean an event-driven trigger",
      "CloudFront → S3 if your goal is static content delivery",
    ],
    "DynamoDB->Lambda": [
      "Lambda → DynamoDB for application data access",
      "S3 → Lambda for event-driven processing",
      "API Gateway → Lambda → DynamoDB for a serverless backend",
    ],
    "RDS->CloudFront": [
      "CloudFront → API Gateway → Lambda → RDS",
      "ALB → EC2 → RDS",
      "CloudFront → S3 for static content and EC2/Lambda → RDS for data access",
    ],
    "RDS->S3": [
      "EC2 → RDS for relational database access",
      "Lambda → RDS for serverless access to a relational database",
      "EC2 → S3 if the application also needs object storage",
    ],
    "DynamoDB->CloudFront": [
      "CloudFront → API Gateway → Lambda → DynamoDB",
      "CloudFront → S3 for static delivery",
      "EC2 → DynamoDB if your application runs on virtual machines",
    ],
    "RDS->API Gateway": [
      "API Gateway → Lambda → RDS",
      "ALB → EC2 → RDS",
      "Use Lambda or EC2 as the application layer before the database",
    ],
    "DynamoDB->RDS": [
      "Lambda → DynamoDB and Lambda → RDS if one function coordinates both stores",
      "EC2 → DynamoDB and EC2 → RDS through an application layer",
      "Choose one main storage path per workload if the architecture is still unclear",
    ],
    "RDS->Lambda": [
      "Lambda → RDS",
      "API Gateway → Lambda → RDS",
      "ALB → EC2 → RDS if the workload is more traditional",
    ],
    "RDS->EC2": [
      "EC2 → RDS",
      "ALB → EC2 → RDS",
      "Lambda → RDS if this should be a serverless access pattern",
    ],
  };

  if (specificSuggestions[connection]) {
    return specificSuggestions[connection];
  }

  return [
    "Try a known pattern such as S3 → CloudFront.",
    "For APIs, use API Gateway → Lambda → DynamoDB or API Gateway → Lambda → RDS.",
    "For traditional web apps, use ALB → EC2 → RDS.",
  ];
}
