import type { Edge, Node } from "reactflow";
import { MarkerType } from "reactflow";
import { awsServices } from "./services";
import { getConnectionVerdict } from "../utils/connectionRules";

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  explanation: string;
  nextSteps: string[];
  nodes: Node[];
  edges: Edge[];
}

function getServiceIcon(serviceId: string) {
  return awsServices.find((service) => service.id === serviceId)?.icon ?? "";
}

function createNode(
  id: string,
  serviceId: string,
  label: string,
  x: number,
  y: number
): Node {
  return {
    id,
    type: "awsService",
    position: { x, y },
    data: {
      label,
      icon: getServiceIcon(serviceId),
    },
  };
}

function createEdge(source: string, target: string, sourceLabel: string, targetLabel: string): Edge {
  const verdict = getConnectionVerdict(sourceLabel, targetLabel);

  let edgeColor = "#2563eb";
  let isAnimated = false;
  let edgeClassName = "edge-flow edge-flow--request";

  if (verdict.flowType === "data") {
    edgeColor = "#7c3aed";
    edgeClassName = "edge-flow edge-flow--data";
  }

  if (verdict.flowType === "event") {
    edgeColor = "#16a34a";
    isAnimated = true;
    edgeClassName = "edge-flow edge-flow--event";
  }

  if (verdict.flowType === "warning" || verdict.severity === "warning") {
    edgeColor = "#f59e0b";
    isAnimated = true;
    edgeClassName = "edge-flow edge-flow--warning";
  }

  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle: "source",
    targetHandle: "target",
    type: "smoothstep",
    animated: isAnimated,
    interactionWidth: 40,
    className: edgeClassName,
    style: {
      stroke: edgeColor,
      strokeWidth: 2.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeColor,
    },
  };
}

const staticWebsiteNodes: Node[] = [
  createNode("tpl-cloudfront", "cloudfront", "CloudFront", 120, 180),
  createNode("tpl-s3", "s3", "S3", 430, 180),
];

const serverlessApiNodes: Node[] = [
  createNode("tpl-apigw", "apigateway", "API Gateway", 80, 180),
  createNode("tpl-lambda", "lambda", "Lambda", 370, 180),
  createNode("tpl-dynamodb", "dynamodb", "DynamoDB", 660, 180),
];

const webAppNodes: Node[] = [
  createNode("tpl-alb", "alb", "ALB", 70, 180),
  createNode("tpl-ec2", "ec2", "EC2", 360, 180),
  createNode("tpl-rds", "rds", "RDS", 650, 180),
];

export const architectureTemplates: ArchitectureTemplate[] = [
  {
    id: "static-website",
    name: "Static website",
    description:
      "Common static delivery pattern with CloudFront in front of S3.",
    explanation:
      "CloudFront is the public entry point and serves content globally, while S3 stores the website files and assets.",
    nextSteps: ["Add Route 53", "Add ACM / TLS", "Add logging or monitoring"],
    nodes: staticWebsiteNodes,
    edges: [createEdge("tpl-cloudfront", "tpl-s3", "CloudFront", "S3")],
  },
  {
    id: "serverless-api",
    name: "Serverless API",
    description:
      "Common serverless API pattern with API Gateway, Lambda, and DynamoDB.",
    explanation:
      "API Gateway receives the request, Lambda runs the application logic, and DynamoDB stores the data.",
    nextSteps: ["Add authentication", "Add monitoring", "Add throttling or caching"],
    nodes: serverlessApiNodes,
    edges: [
      createEdge("tpl-apigw", "tpl-lambda", "API Gateway", "Lambda"),
      createEdge("tpl-lambda", "tpl-dynamodb", "Lambda", "DynamoDB"),
    ],
  },
  {
    id: "web-app-database",
    name: "Web app + database",
    description:
      "Classic web application pattern with ALB, EC2, and RDS.",
    explanation:
      "ALB handles incoming traffic, EC2 runs the application, and RDS provides relational storage.",
    nextSteps: ["Add Auto Scaling", "Add monitoring", "Add backups and security controls"],
    nodes: webAppNodes,
    edges: [
      createEdge("tpl-alb", "tpl-ec2", "ALB", "EC2"),
      createEdge("tpl-ec2", "tpl-rds", "EC2", "RDS"),
    ],
  },
];
