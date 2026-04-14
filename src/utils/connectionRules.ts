export type ConnectionSeverity = "allowed" | "warning" | "rejected";
export type ConnectionFlowType = "request" | "data" | "event" | "warning";

export interface ConnectionVerdict {
  severity: ConnectionSeverity;
  flowType?: ConnectionFlowType;
  message: string;
  suggestion?: string;
}

function pair(sourceLabel: string, targetLabel: string) {
  return `${sourceLabel}->${targetLabel}`;
}

export function getConnectionVerdict(
  sourceLabel: string,
  targetLabel: string
): ConnectionVerdict {
  if (sourceLabel === targetLabel) {
    return {
      severity: "rejected",
      message: `${sourceLabel} should not connect to itself.`,
      suggestion:
        "Connect it to another service that represents the next step in the architecture.",
    };
  }

  const connection = pair(sourceLabel, targetLabel);

  const allowedConnections: Record<string, ConnectionVerdict> = {
    "S3->CloudFront": {
      severity: "allowed",
      flowType: "request",
      message: "S3 and CloudFront are a common pattern for static content delivery.",
      suggestion:
        "Use this when S3 stores the files and CloudFront serves them globally.",
    },
    "CloudFront->S3": {
      severity: "allowed",
      flowType: "request",
      message: "CloudFront can use S3 as the origin for static content.",
      suggestion:
        "This is a typical setup for websites, images, and downloadable assets.",
    },
    "API Gateway->Lambda": {
      severity: "allowed",
      flowType: "request",
      message: "API Gateway and Lambda are a common serverless API pattern.",
      suggestion:
        "Use this when API Gateway receives the request and Lambda handles the logic.",
    },
    "Lambda->DynamoDB": {
      severity: "allowed",
      flowType: "data",
      message: "Lambda can read from or write to DynamoDB.",
      suggestion:
        "This is a common data access pattern in serverless applications.",
    },
    "ALB->EC2": {
      severity: "allowed",
      flowType: "request",
      message: "ALB can distribute incoming traffic to EC2 instances.",
      suggestion:
        "This is a standard pattern for traditional web or application servers.",
    },
    "ALB->Lambda": {
      severity: "allowed",
      flowType: "request",
      message: "ALB can route requests to Lambda.",
      suggestion:
        "This is useful when you want Lambda behind a load-balanced HTTP entry point.",
    },
    "EC2->RDS": {
      severity: "allowed",
      flowType: "data",
      message: "EC2 can connect to RDS for relational data storage.",
      suggestion:
        "This is a common pattern for application servers with a relational database.",
    },
    "Lambda->RDS": {
      severity: "allowed",
      flowType: "data",
      message: "Lambda can connect to RDS for relational data access.",
      suggestion:
        "Use this when Lambda needs application logic in front of relational data.",
    },
    "EC2->S3": {
      severity: "allowed",
      flowType: "data",
      message: "EC2 can access S3 for files, artifacts, and object storage.",
      suggestion:
        "This is common for uploads, backups, logs, or static assets.",
    },
    "Lambda->S3": {
      severity: "allowed",
      flowType: "data",
      message: "Lambda can read from or write to S3.",
      suggestion:
        "This works well for file processing, uploads, and event-driven tasks.",
    },
    "S3->Lambda": {
      severity: "allowed",
      flowType: "event",
      message: "S3 can trigger Lambda in an event-driven pattern.",
      suggestion:
        "Treat this as an event or trigger relationship rather than a classic request flow.",
    },
    "CloudFront->API Gateway": {
      severity: "allowed",
      flowType: "request",
      message: "CloudFront can sit in front of API Gateway for edge delivery and caching.",
      suggestion:
        "This is useful when you want a global entry point in front of your API.",
    },
    "EC2->DynamoDB": {
      severity: "allowed",
      flowType: "data",
      message: "EC2 can access DynamoDB through the AWS API.",
      suggestion:
        "This can work well when application logic runs on EC2 and uses DynamoDB for storage.",
    },
  };

  if (allowedConnections[connection]) {
    return allowedConnections[connection];
  }

  const warningConnections: Record<string, ConnectionVerdict> = {
    "API Gateway->EC2": {
      severity: "warning",
      flowType: "warning",
      message:
        "API Gateway to EC2 is possible, but an ALB-backed design is often clearer for web workloads.",
      suggestion:
        "Consider ALB → EC2 if this is a traditional web application.",
    },
    "Lambda->EC2": {
      severity: "warning",
      flowType: "warning",
      message:
        "Lambda to EC2 can work in some integration scenarios, but it is not a common primary application flow.",
      suggestion:
        "Check whether EC2 should instead talk to RDS or S3, or whether Lambda should target an API or data service.",
    },
    "API Gateway->RDS": {
      severity: "warning",
      flowType: "warning",
      message:
        "API Gateway should usually not talk directly to RDS without application logic in between.",
      suggestion:
        "Consider API Gateway → Lambda → RDS or ALB → EC2 → RDS.",
    },
    "CloudFront->EC2": {
      severity: "warning",
      flowType: "warning",
      message:
        "CloudFront in front of EC2 can work, but make sure EC2 is really intended to be the origin.",
      suggestion:
        "For classic web stacks, ALB → EC2 is often clearer. For static content, CloudFront → S3 is more typical.",
    },
    "S3->EC2": {
      severity: "warning",
      flowType: "warning",
      message:
        "This relationship can exist, but S3 to EC2 is less often shown as a primary architecture flow.",
      suggestion:
        "If EC2 is consuming files from S3, EC2 → S3 usually communicates the relationship more clearly.",
    },
    "DynamoDB->Lambda": {
      severity: "warning",
      flowType: "warning",
      message:
        "DynamoDB to Lambda can happen through streams or event integrations, but it is not a standard request flow.",
      suggestion:
        "If Lambda is the application layer accessing DynamoDB, Lambda → DynamoDB is usually the clearer direction.",
    },
  };

  if (warningConnections[connection]) {
    return warningConnections[connection];
  }

  const rejectedConnections: Record<string, ConnectionVerdict> = {
    "DynamoDB->CloudFront": {
      severity: "rejected",
      message: "DynamoDB cannot directly deliver content to CloudFront.",
      suggestion:
        "Try Lambda → DynamoDB and CloudFront → S3 or CloudFront → API Gateway instead.",
    },
    "RDS->CloudFront": {
      severity: "rejected",
      message: "RDS cannot directly serve content to CloudFront.",
      suggestion:
        "Use EC2 or Lambda as the application layer between CloudFront and RDS.",
    },
    "RDS->S3": {
      severity: "rejected",
      message:
        "RDS to S3 is not a typical primary application flow in this builder.",
      suggestion:
        "For application access, use EC2 → RDS or Lambda → RDS instead.",
    },
    "DynamoDB->ALB": {
      severity: "rejected",
      message: "DynamoDB should not sit directly behind an ALB.",
      suggestion:
        "Use Lambda or another application layer between the load balancer and the database.",
    },
    "CloudFront->RDS": {
      severity: "rejected",
      message: "CloudFront cannot directly connect to RDS.",
      suggestion:
        "Use CloudFront → API Gateway or ALB, then connect through an application layer to RDS.",
    },
    "RDS->API Gateway": {
      severity: "rejected",
      message:
        "RDS cannot directly act as an API Gateway backend in this architecture model.",
      suggestion:
        "Use Lambda or EC2 between API Gateway and RDS.",
    },
    "DynamoDB->RDS": {
      severity: "rejected",
      message:
        "DynamoDB and RDS should not be directly chained as an application flow.",
      suggestion:
        "Use an application layer such as Lambda or EC2 to coordinate data access.",
    },
    "RDS->Lambda": {
      severity: "rejected",
      message:
        "RDS should not be modeled as directly invoking Lambda in this builder.",
      suggestion:
        "If Lambda accesses RDS, model it as Lambda → RDS instead.",
    },
    "RDS->EC2": {
      severity: "rejected",
      message:
        "RDS is normally consumed by EC2, not the other way around in a request-flow diagram.",
      suggestion:
        "Use EC2 → RDS to show application access to the database.",
    },
  };

  if (rejectedConnections[connection]) {
    return rejectedConnections[connection];
  }

  return {
    severity: "warning",
    flowType: "warning",
    message:
      "This connection is possible, but it is not a common default architecture pattern and should be reviewed.",
    suggestion:
      "Check whether this should be modeled as a request flow, a data access path, or an event-driven relationship. A more typical design may include Lambda, EC2, ALB, or API Gateway between these services.",
  };
}
