import type { Edge, Node } from "reactflow";

export interface ValidationResult {
  status: "Valid" | "Valid with warnings" | "Not recommended";
  summary: string;
  warnings: string[];
  suggestions: string[];
  detectedPatterns: string[];
  unconnectedServices: string[];
  flowDescriptions: string[];
}

function getServiceLabelMap(nodes: Node[]) {
  return new Map(nodes.map((node) => [node.id, String(node.data?.label ?? "")]));
}

function hasConnectionBetween(
  edges: Edge[],
  sourceIds: string[],
  targetIds: string[]
): boolean {
  return edges.some(
    (edge) => sourceIds.includes(edge.source) && targetIds.includes(edge.target)
  );
}

function getNodeIdsByLabel(nodes: Node[], label: string): string[] {
  return nodes
    .filter((node) => String(node.data?.label ?? "") === label)
    .map((node) => node.id);
}

function getConnectedNodeIds(edges: Edge[]): Set<string> {
  const connectedIds = new Set<string>();

  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  return connectedIds;
}

function describeConnection(sourceLabel: string, targetLabel: string): string {
  if (sourceLabel === "S3" && targetLabel === "CloudFront") {
    return "CloudFront delivers static content from S3.";
  }

  if (sourceLabel === "CloudFront" && targetLabel === "S3") {
    return "CloudFront uses S3 as the origin for static content.";
  }

  if (sourceLabel === "API Gateway" && targetLabel === "Lambda") {
    return "API Gateway triggers Lambda to process incoming requests.";
  }

  if (sourceLabel === "Lambda" && targetLabel === "DynamoDB") {
    return "Lambda reads from or writes to DynamoDB.";
  }

  if (sourceLabel === "ALB" && targetLabel === "EC2") {
    return "ALB distributes incoming traffic to EC2.";
  }

  if (sourceLabel === "ALB" && targetLabel === "Lambda") {
    return "ALB routes requests directly to Lambda.";
  }

  if (sourceLabel === "EC2" && targetLabel === "RDS") {
    return "EC2 communicates with RDS for relational data storage.";
  }

  if (sourceLabel === "Lambda" && targetLabel === "RDS") {
    return "Lambda connects to RDS for relational data access.";
  }

  if (sourceLabel === "EC2" && targetLabel === "S3") {
    return "EC2 accesses S3 for files, artifacts, or object storage.";
  }

  if (sourceLabel === "Lambda" && targetLabel === "S3") {
    return "Lambda interacts with S3 for object storage operations.";
  }

  if (sourceLabel === "S3" && targetLabel === "Lambda") {
    return "S3 triggers Lambda in an event-driven pattern.";
  }

  if (sourceLabel === "CloudFront" && targetLabel === "API Gateway") {
    return "CloudFront fronts API Gateway for edge delivery or caching.";
  }

  if (sourceLabel === "EC2" && targetLabel === "DynamoDB") {
    return "EC2 accesses DynamoDB through the AWS API.";
  }

  return `${sourceLabel} connects to ${targetLabel}.`;
}

export function validateArchitecture(
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  if (nodes.length === 0) {
    return {
      status: "Not recommended",
      summary: "No services placed on the canvas yet.",
      warnings: ["Drag AWS services from the sidebar onto the canvas to begin."],
      suggestions: [
        "Start with a simple pattern such as S3 + CloudFront or API Gateway + Lambda.",
      ],
      detectedPatterns: [],
      unconnectedServices: [],
      flowDescriptions: [],
    };
  }

  const warnings: string[] = [];
  const suggestions: string[] = [];
  const detectedPatterns: string[] = [];

  const labelMap = getServiceLabelMap(nodes);
  const connectedIds = getConnectedNodeIds(edges);

  const flowDescriptions = edges
    .map((edge) => {
      const sourceLabel = labelMap.get(edge.source);
      const targetLabel = labelMap.get(edge.target);

      if (!sourceLabel || !targetLabel) {
        return null;
      }

      return describeConnection(sourceLabel, targetLabel);
    })
    .filter((item): item is string => Boolean(item));

  const s3Ids = getNodeIdsByLabel(nodes, "S3");
  const cloudFrontIds = getNodeIdsByLabel(nodes, "CloudFront");
  const apiGatewayIds = getNodeIdsByLabel(nodes, "API Gateway");
  const lambdaIds = getNodeIdsByLabel(nodes, "Lambda");
  const dynamoDbIds = getNodeIdsByLabel(nodes, "DynamoDB");
  const ec2Ids = getNodeIdsByLabel(nodes, "EC2");
  const albIds = getNodeIdsByLabel(nodes, "ALB");
  const rdsIds = getNodeIdsByLabel(nodes, "RDS");

  const hasS3ToCloudFront = hasConnectionBetween(edges, s3Ids, cloudFrontIds);
  const hasCloudFrontToS3 = hasConnectionBetween(edges, cloudFrontIds, s3Ids);
  const hasApiGatewayToLambda = hasConnectionBetween(edges, apiGatewayIds, lambdaIds);
  const hasLambdaToDynamoDb = hasConnectionBetween(edges, lambdaIds, dynamoDbIds);
  const hasAlbToEc2 = hasConnectionBetween(edges, albIds, ec2Ids);
  const hasAlbToLambda = hasConnectionBetween(edges, albIds, lambdaIds);
  const hasEc2ToRds = hasConnectionBetween(edges, ec2Ids, rdsIds);
  const hasLambdaToRds = hasConnectionBetween(edges, lambdaIds, rdsIds);
  const hasApiGatewayToEc2 = hasConnectionBetween(edges, apiGatewayIds, ec2Ids);
  const hasEc2ToS3 = hasConnectionBetween(edges, ec2Ids, s3Ids);
  const hasLambdaToS3 = hasConnectionBetween(edges, lambdaIds, s3Ids);
  const hasS3ToLambda = hasConnectionBetween(edges, s3Ids, lambdaIds);
  const hasCloudFrontToApiGateway = hasConnectionBetween(edges, cloudFrontIds, apiGatewayIds);
  const hasEc2ToDynamoDb = hasConnectionBetween(edges, ec2Ids, dynamoDbIds);

  if (hasS3ToCloudFront || hasCloudFrontToS3) {
    detectedPatterns.push(
      "Static content delivery pattern detected: S3 and CloudFront are connected."
    );
  }

  if (hasApiGatewayToLambda) {
    detectedPatterns.push(
      "Serverless API pattern detected: API Gateway is connected to Lambda."
    );
  }

  if (hasLambdaToDynamoDb) {
    detectedPatterns.push(
      "Serverless data access pattern detected: Lambda is connected to DynamoDB."
    );
  }

  if (hasAlbToEc2) {
    detectedPatterns.push(
      "Traditional web entry pattern detected: ALB is connected to EC2."
    );
  }

  if (hasAlbToLambda) {
    detectedPatterns.push(
      "ALB-to-Lambda pattern detected: load balancer routes requests directly to Lambda."
    );
  }

  if (hasEc2ToRds) {
    detectedPatterns.push(
      "Traditional application database pattern detected: EC2 is connected to RDS."
    );
  }

  if (hasApiGatewayToLambda && hasLambdaToDynamoDb) {
    detectedPatterns.push(
      "End-to-end serverless backend detected: API Gateway → Lambda → DynamoDB."
    );
  }

  if (hasAlbToEc2 && hasEc2ToRds) {
    detectedPatterns.push(
      "Classic application stack detected: ALB → EC2 → RDS."
    );
  }

  if (hasEc2ToS3) {
    detectedPatterns.push(
      "Application-to-object-storage pattern detected: EC2 is connected to S3."
    );
  }

  if (hasLambdaToS3) {
    detectedPatterns.push(
      "Serverless object-storage interaction detected: Lambda is connected to S3."
    );
  }

  if (hasS3ToLambda) {
    detectedPatterns.push(
      "Event-driven pattern detected: S3 is connected to Lambda."
    );
  }

  if (hasCloudFrontToApiGateway) {
    detectedPatterns.push(
      "Edge API entry pattern detected: CloudFront is connected to API Gateway."
    );
  }

  if (hasEc2ToDynamoDb) {
    detectedPatterns.push(
      "Application-to-NoSQL pattern detected: EC2 is connected to DynamoDB."
    );
  }

  if (dynamoDbIds.length > 0 && !hasLambdaToDynamoDb && !hasEc2ToDynamoDb) {
    warnings.push(
      "DynamoDB is on the canvas but no clear application connection from Lambda or EC2 was detected."
    );
  }

  if (apiGatewayIds.length > 0 && lambdaIds.length > 0 && !hasApiGatewayToLambda) {
    warnings.push("API Gateway and Lambda are present but not connected.");
  }

  if (
    s3Ids.length > 0 &&
    cloudFrontIds.length > 0 &&
    !(hasS3ToCloudFront || hasCloudFrontToS3)
  ) {
    warnings.push("S3 and CloudFront are present but not connected.");
  }

  if (rdsIds.length > 0 && !hasEc2ToRds && !hasLambdaToRds) {
    warnings.push(
      "RDS is present without a detected application connection from EC2 or Lambda."
    );
  }

  if (
    ec2Ids.length > 0 &&
    albIds.length === 0 &&
    apiGatewayIds.length === 0 &&
    nodes.length >= 3
  ) {
    warnings.push(
      "EC2 is present without ALB or API Gateway. Review whether an entry layer is missing."
    );
  }

  if (apiGatewayIds.length > 0 && ec2Ids.length > 0 && !hasApiGatewayToEc2) {
    suggestions.push(
      "If EC2 is meant to serve requests behind the API layer, consider connecting API Gateway to EC2 or using ALB depending on the workload."
    );
  }

  if (edges.length === 0 && nodes.length > 1) {
    warnings.push(
      "Multiple services are present, but no connections were drawn between them."
    );
  }

  const unconnectedServices = nodes
    .filter((node) => !connectedIds.has(node.id))
    .map((node) => labelMap.get(node.id) ?? "Unknown service");

  if (unconnectedServices.length > 0 && nodes.length > 1) {
    warnings.push(
      "Some services are isolated and not connected to the rest of the architecture."
    );
  }

  if (detectedPatterns.length === 0 && warnings.length === 0) {
    return {
      status: "Valid with warnings",
      summary:
        "Services are present, but no strong architecture pattern was detected yet.",
      warnings: ["Connect services to form a clearer workload pattern."],
      suggestions: [
        "Try patterns like S3 → CloudFront, API Gateway → Lambda → DynamoDB, or ALB → EC2 → RDS.",
      ],
      detectedPatterns,
      unconnectedServices,
      flowDescriptions,
    };
  }

  if (warnings.length > 0 && detectedPatterns.length === 0) {
    return {
      status: "Not recommended",
      summary:
        "The current architecture appears incomplete or weakly connected.",
      warnings,
      suggestions: suggestions.length
        ? suggestions
        : ["Add meaningful connections between services to form a valid pattern."],
      detectedPatterns,
      unconnectedServices,
      flowDescriptions,
    };
  }

  if (warnings.length > 0) {
    return {
      status: "Valid with warnings",
      summary:
        detectedPatterns[0] ??
        "The architecture has some good elements but still needs review.",
      warnings,
      suggestions: suggestions.length
        ? suggestions
        : ["Review isolated services and missing connections."],
      detectedPatterns,
      unconnectedServices,
      flowDescriptions,
    };
  }

  return {
    status: "Valid",
    summary:
      detectedPatterns[0] ??
      "This architecture looks reasonable for a simple workload.",
    warnings: [],
    suggestions: [
      "Consider adding monitoring, IAM least privilege, and cost review as next steps.",
    ],
    detectedPatterns,
    unconnectedServices,
    flowDescriptions,
  };
}
