export type ExerciseCategoryId =
  | "build_patterns"
  | "complete_patterns"
  | "fix_broken_architectures";

export type ExerciseMode = "build" | "complete" | "fix";

export interface ExerciseRequirement {
  nodes: string[];
  edges: Array<{
    source: string;
    target: string;
  }>;
}

export interface ArchitectureExercise {
  id: string;
  categoryId: ExerciseCategoryId;
  mode: ExerciseMode;
  title: string;
  shortDescription: string;
  instruction: string;
  successMessage: string;
  hint: string;
  requirement: ExerciseRequirement;
  starterNodes?: string[];
  starterEdges?: Array<{
    source: string;
    target: string;
  }>;
}

export interface ExerciseCategory {
  id: ExerciseCategoryId;
  title: string;
  description: string;
}

export const exerciseCategories: ExerciseCategory[] = [
  {
    id: "build_patterns",
    title: "Build patterns",
    description:
      "Build a common AWS architecture pattern from scratch.",
  },
  {
    id: "complete_patterns",
    title: "Complete patterns",
    description:
      "Finish a partially built architecture by adding the missing services or connections.",
  },
  {
    id: "fix_broken_architectures",
    title: "Fix broken architectures",
    description:
      "Correct an intentionally weak or problematic architecture design.",
  },
];

export const architectureExercises: ArchitectureExercise[] = [
  {
    id: "build-static-website",
    categoryId: "build_patterns",
    mode: "build",
    title: "Build a static website",
    shortDescription: "Create a static website delivery pattern.",
    instruction:
      "Build a static website architecture with a storage layer and a global delivery layer.",
    successMessage:
      "Well done. You built a common static website delivery pattern.",
    hint:
      "Think about object storage for website files and a global content delivery layer.",
    requirement: {
      nodes: ["S3", "CloudFront"],
      edges: [
        {
          source: "CloudFront",
          target: "S3",
        },
      ],
    },
  },
  {
    id: "build-serverless-api",
    categoryId: "build_patterns",
    mode: "build",
    title: "Build a serverless API",
    shortDescription: "Create a request, compute, and data flow.",
    instruction:
      "Build a serverless API with a public entry point, serverless compute, and a NoSQL data layer.",
    successMessage:
      "Great. You built a common serverless API pattern.",
    hint:
      "A typical flow is public API → compute → NoSQL storage.",
    requirement: {
      nodes: ["API Gateway", "Lambda", "DynamoDB"],
      edges: [
        {
          source: "API Gateway",
          target: "Lambda",
        },
        {
          source: "Lambda",
          target: "DynamoDB",
        },
      ],
    },
  },
  {
    id: "build-web-app-db",
    categoryId: "build_patterns",
    mode: "build",
    title: "Build a web app with database",
    shortDescription: "Create a classic web application pattern.",
    instruction:
      "Build a classic web architecture with a traffic entry layer, instance-based compute, and relational storage.",
    successMessage:
      "Nice. You built a standard web app plus database pattern.",
    hint:
      "Think load balancing first, then compute, then relational data.",
    requirement: {
      nodes: ["ALB", "EC2", "RDS"],
      edges: [
        {
          source: "ALB",
          target: "EC2",
        },
        {
          source: "EC2",
          target: "RDS",
        },
      ],
    },
  },
  {
    id: "build-static-api-split",
    categoryId: "build_patterns",
    mode: "build",
    title: "Build a frontend plus API split",
    shortDescription:
      "Create a static frontend with a separate serverless API path.",
    instruction:
      "Build a pattern where static frontend content is delivered separately from an API backend.",
    successMessage:
      "Good job. You created a split frontend and API architecture.",
    hint:
      "Use one path for static content and one path for backend requests.",
    requirement: {
      nodes: ["CloudFront", "S3", "API Gateway", "Lambda"],
      edges: [
        {
          source: "CloudFront",
          target: "S3",
        },
        {
          source: "API Gateway",
          target: "Lambda",
        },
      ],
    },
  },
  {
    id: "build-event-processing",
    categoryId: "build_patterns",
    mode: "build",
    title: "Build an event-driven file processing flow",
    shortDescription:
      "Create an event-driven pattern triggered by storage events.",
    instruction:
      "Build a pattern where a file upload or storage event triggers serverless processing.",
    successMessage:
      "Great. You built an event-driven processing pattern.",
    hint:
      "Look for an event source and a compute service that can react to it.",
    requirement: {
      nodes: ["S3", "Lambda"],
      edges: [
        {
          source: "S3",
          target: "Lambda",
        },
      ],
    },
  },
  {
    id: "complete-serverless-data-layer",
    categoryId: "complete_patterns",
    mode: "complete",
    title: "Complete the serverless data layer",
    shortDescription:
      "Finish a serverless API by adding the missing data service.",
    instruction:
      "The public API and compute layer already exist. Add the missing data layer and connect it correctly.",
    successMessage:
      "Nice. You completed the serverless API with a data layer.",
    hint:
      "A common next step after API Gateway and Lambda is a NoSQL data service.",
    requirement: {
      nodes: ["API Gateway", "Lambda", "DynamoDB"],
      edges: [
        {
          source: "API Gateway",
          target: "Lambda",
        },
        {
          source: "Lambda",
          target: "DynamoDB",
        },
      ],
    },
    starterNodes: ["API Gateway", "Lambda"],
    starterEdges: [
      {
        source: "API Gateway",
        target: "Lambda",
      },
    ],
  },
  {
    id: "complete-web-data-layer",
    categoryId: "complete_patterns",
    mode: "complete",
    title: "Complete the web app data tier",
    shortDescription:
      "Finish a classic web app by adding the relational database.",
    instruction:
      "The entry layer and compute layer already exist. Add the missing relational data service and connect it correctly.",
    successMessage:
      "Well done. You completed the web app architecture with a database.",
    hint:
      "After ALB and EC2, a common next step is relational storage.",
    requirement: {
      nodes: ["ALB", "EC2", "RDS"],
      edges: [
        {
          source: "ALB",
          target: "EC2",
        },
        {
          source: "EC2",
          target: "RDS",
        },
      ],
    },
    starterNodes: ["ALB", "EC2"],
    starterEdges: [
      {
        source: "ALB",
        target: "EC2",
      },
    ],
  },
  {
    id: "complete-static-origin",
    categoryId: "complete_patterns",
    mode: "complete",
    title: "Complete the static origin setup",
    shortDescription:
      "Finish a content delivery pattern by adding the missing origin.",
    instruction:
      "A delivery layer already exists. Add the correct origin service and connect it properly.",
    successMessage:
      "Good. You completed the static delivery pattern.",
    hint:
      "CloudFront often needs an origin for static website files.",
    requirement: {
      nodes: ["CloudFront", "S3"],
      edges: [
        {
          source: "CloudFront",
          target: "S3",
        },
      ],
    },
    starterNodes: ["CloudFront"],
    starterEdges: [],
  },
  {
    id: "complete-file-processing",
    categoryId: "complete_patterns",
    mode: "complete",
    title: "Complete the file processing pattern",
    shortDescription:
      "Add the missing event source for serverless file processing.",
    instruction:
      "A compute service is already placed. Add the missing storage service that should trigger it.",
    successMessage:
      "Nice. You completed the event-driven processing flow.",
    hint:
      "Think of a storage service that can emit an event to Lambda.",
    requirement: {
      nodes: ["S3", "Lambda"],
      edges: [
        {
          source: "S3",
          target: "Lambda",
        },
      ],
    },
    starterNodes: ["Lambda"],
    starterEdges: [],
  },
  {
    id: "complete-api-behind-cloudfront",
    categoryId: "complete_patterns",
    mode: "complete",
    title: "Complete the edge API path",
    shortDescription:
      "Add the missing service behind the edge delivery layer.",
    instruction:
      "CloudFront is already placed. Add the API entry service that commonly sits behind it in a global API setup.",
    successMessage:
      "Good work. You completed a CloudFront-backed API entry path.",
    hint:
      "CloudFront can sit in front of an API service, not only in front of storage.",
    requirement: {
      nodes: ["CloudFront", "API Gateway"],
      edges: [
        {
          source: "CloudFront",
          target: "API Gateway",
        },
      ],
    },
    starterNodes: ["CloudFront"],
    starterEdges: [],
  },
  {
    id: "fix-direct-api-db",
    categoryId: "fix_broken_architectures",
    mode: "fix",
    title: "Fix direct API-to-database access",
    shortDescription:
      "Correct an API path that connects too directly to storage.",
    instruction:
      "This architecture connects API Gateway directly to RDS. Replace that with a more typical pattern.",
    successMessage:
      "Great. You replaced the weak direct path with a stronger application flow.",
    hint:
      "Insert an application layer between the public API and the relational database.",
    requirement: {
      nodes: ["API Gateway", "Lambda", "RDS"],
      edges: [
        {
          source: "API Gateway",
          target: "Lambda",
        },
        {
          source: "Lambda",
          target: "RDS",
        },
      ],
    },
    starterNodes: ["API Gateway", "RDS"],
    starterEdges: [
      {
        source: "API Gateway",
        target: "RDS",
      },
    ],
  },
  {
    id: "fix-cloudfront-db",
    categoryId: "fix_broken_architectures",
    mode: "fix",
    title: "Fix direct CloudFront-to-database access",
    shortDescription:
      "Replace a broken direct path between delivery and relational storage.",
    instruction:
      "This architecture connects CloudFront directly to RDS. Replace it with a more realistic application path.",
    successMessage:
      "Nice. You replaced the broken delivery-to-database path with a more valid design.",
    hint:
      "CloudFront should usually sit in front of an application or content origin, not directly in front of a database.",
    requirement: {
      nodes: ["CloudFront", "API Gateway", "Lambda", "RDS"],
      edges: [
        {
          source: "CloudFront",
          target: "API Gateway",
        },
        {
          source: "API Gateway",
          target: "Lambda",
        },
        {
          source: "Lambda",
          target: "RDS",
        },
      ],
    },
    starterNodes: ["CloudFront", "RDS"],
    starterEdges: [
      {
        source: "CloudFront",
        target: "RDS",
      },
    ],
  },
  {
    id: "fix-dynamodb-to-cloudfront",
    categoryId: "fix_broken_architectures",
    mode: "fix",
    title: "Fix a broken NoSQL delivery path",
    shortDescription:
      "Replace a direct DynamoDB to CloudFront path with a better architecture.",
    instruction:
      "This architecture uses DynamoDB directly with CloudFront. Replace it with a more realistic application flow.",
    successMessage:
      "Good. You replaced the broken NoSQL delivery path with a better architecture.",
    hint:
      "Add an application or API layer between data access and global delivery.",
    requirement: {
      nodes: ["CloudFront", "API Gateway", "Lambda", "DynamoDB"],
      edges: [
        {
          source: "CloudFront",
          target: "API Gateway",
        },
        {
          source: "API Gateway",
          target: "Lambda",
        },
        {
          source: "Lambda",
          target: "DynamoDB",
        },
      ],
    },
    starterNodes: ["DynamoDB", "CloudFront"],
    starterEdges: [
      {
        source: "DynamoDB",
        target: "CloudFront",
      },
    ],
  },
  {
    id: "fix-direct-storage-compute-direction",
    categoryId: "fix_broken_architectures",
    mode: "fix",
    title: "Fix the storage-to-compute direction",
    shortDescription:
      "Correct a relationship that is modeled in the less useful direction.",
    instruction:
      "This architecture shows S3 directly pointing to EC2. Replace it with a clearer architecture relationship.",
    successMessage:
      "Nice. You corrected the storage and compute direction to a clearer pattern.",
    hint:
      "If EC2 consumes files from S3, the clearer direction usually starts at the compute layer.",
    requirement: {
      nodes: ["EC2", "S3"],
      edges: [
        {
          source: "EC2",
          target: "S3",
        },
      ],
    },
    starterNodes: ["S3", "EC2"],
    starterEdges: [
      {
        source: "S3",
        target: "EC2",
      },
    ],
  },
  {
    id: "fix-db-to-compute-direction",
    categoryId: "fix_broken_architectures",
    mode: "fix",
    title: "Fix the database direction",
    shortDescription:
      "Correct a database relationship that is modeled in the wrong direction.",
    instruction:
      "This architecture shows RDS directly pointing to EC2. Replace it with the more typical application access direction.",
    successMessage:
      "Well done. You corrected the database access direction.",
    hint:
      "The application layer usually consumes the database, not the other way around.",
    requirement: {
      nodes: ["EC2", "RDS"],
      edges: [
        {
          source: "EC2",
          target: "RDS",
        },
      ],
    },
    starterNodes: ["RDS", "EC2"],
    starterEdges: [
      {
        source: "RDS",
        target: "EC2",
      },
    ],
  },
];

export function getExercisesByCategory(categoryId: ExerciseCategoryId) {
  return architectureExercises.filter(
    (exercise) => exercise.categoryId === categoryId
  );
}
