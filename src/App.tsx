import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import "reactflow/dist/style.css";

import AwsServiceNode from "./components/AwsServiceNode";
import FlowFeedbackPanel from "./components/FlowFeedbackPanel";
import ValidationPanel from "./components/ValidationPanel";
import {
  exerciseCategories,
  type ArchitectureExercise,
  type ExerciseCategoryId,
} from "./data/exercises";
import { awsServices } from "./data/services";
import { getConnectionVerdict } from "./utils/connectionRules";
import { getSuggestedFixes } from "./utils/connectionSuggestions";
import { validateArchitecture } from "./utils/validateArchitecture";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

type FeedbackTone = "info" | "success" | "warning" | "error";
type HighlightTone = "template" | null;

interface FlowFeedback {
  tone: FeedbackTone;
  title: string;
  message: string;
  suggestion?: string;
  fixOptions?: string[];
}

function getServiceRoleHint(label: string) {
  const hints: Record<string, string> = {
    S3: "storage layer for files and static assets",
    CloudFront: "global delivery and caching layer",
    "API Gateway": "public API entry layer",
    Lambda: "application logic / compute layer",
    DynamoDB: "NoSQL data layer",
    EC2: "instance-based compute layer",
    ALB: "traffic distribution entry layer",
    RDS: "relational data layer",
  };

  return hints[label] ?? "service layer";
}

function getConnectionMeaning(
  sourceLabel: string,
  targetLabel: string,
  flowType: "request" | "data" | "event" | "warning" | undefined
) {
  const pair = `${sourceLabel}->${targetLabel}`;

  const specificMeanings: Record<string, string> = {
    "CloudFront->S3":
      "CloudFront uses S3 as the origin, so S3 stores the files and CloudFront handles global delivery and caching.",
    "S3->CloudFront":
      "This models a static content delivery relationship between S3 storage and CloudFront distribution.",
    "API Gateway->Lambda":
      "API Gateway receives public requests and forwards them to Lambda, which handles the application logic.",
    "Lambda->DynamoDB":
      "Lambda acts as the compute layer and DynamoDB acts as the data layer for serverless application access.",
    "ALB->EC2":
      "ALB distributes incoming application traffic to EC2 instances.",
    "ALB->Lambda":
      "ALB acts as the HTTP entry point and routes matching requests to Lambda.",
    "EC2->RDS":
      "EC2 runs the application logic and RDS stores the relational application data.",
    "Lambda->RDS":
      "Lambda executes the application logic and connects to RDS when relational storage is needed.",
    "EC2->S3":
      "EC2 uses S3 as an object storage layer for files, assets, or generated output.",
    "Lambda->S3":
      "Lambda interacts with S3 for file reads, writes, or processing workflows.",
    "S3->Lambda":
      "S3 triggers Lambda as part of an event-driven workflow, such as file upload processing.",
    "CloudFront->API Gateway":
      "CloudFront sits in front of API Gateway to provide a global entry point and optional caching.",
    "EC2->DynamoDB":
      "EC2 runs the application and accesses DynamoDB as a managed NoSQL data layer.",
  };

  if (specificMeanings[pair]) {
    return specificMeanings[pair];
  }

  if (flowType === "request") {
    return `${sourceLabel} acts as the request or entry layer, while ${targetLabel} acts as the next processing or delivery layer.`;
  }

  if (flowType === "data") {
    return `${sourceLabel} uses ${targetLabel} as part of the data or storage layer in this architecture.`;
  }

  if (flowType === "event") {
    return `${sourceLabel} is modeled as an event source or trigger for ${targetLabel}.`;
  }

  return `${sourceLabel} is connected to ${targetLabel}, but this relationship should be reviewed to confirm the intended architecture meaning.`;
}

function createEdgeFromLabels(
  sourceNodeId: string,
  targetNodeId: string,
  sourceLabel: string,
  targetLabel: string
): Edge {
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
    id: `${sourceNodeId}-${targetNodeId}-${Date.now()}`,
    source: sourceNodeId,
    target: targetNodeId,
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

function getServiceIcon(label: string) {
  return awsServices.find((service) => service.label === label)?.icon ?? "";
}

function getExerciseLibrary() {
  const buildPatterns: ArchitectureExercise[] = [
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
        edges: [{ source: "CloudFront", target: "S3" }],
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
      successMessage: "Great. You built a common serverless API pattern.",
      hint: "A typical flow is public API → compute → NoSQL storage.",
      requirement: {
        nodes: ["API Gateway", "Lambda", "DynamoDB"],
        edges: [
          { source: "API Gateway", target: "Lambda" },
          { source: "Lambda", target: "DynamoDB" },
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
      hint: "Think load balancing first, then compute, then relational data.",
      requirement: {
        nodes: ["ALB", "EC2", "RDS"],
        edges: [
          { source: "ALB", target: "EC2" },
          { source: "EC2", target: "RDS" },
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
          { source: "CloudFront", target: "S3" },
          { source: "API Gateway", target: "Lambda" },
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
      successMessage: "Great. You built an event-driven processing pattern.",
      hint: "Look for an event source and a compute service that can react to it.",
      requirement: {
        nodes: ["S3", "Lambda"],
        edges: [{ source: "S3", target: "Lambda" }],
      },
    },
  ];

  const completePatterns: ArchitectureExercise[] = [
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
          { source: "API Gateway", target: "Lambda" },
          { source: "Lambda", target: "DynamoDB" },
        ],
      },
      starterNodes: ["API Gateway", "Lambda"],
      starterEdges: [{ source: "API Gateway", target: "Lambda" }],
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
      hint: "After ALB and EC2, a common next step is relational storage.",
      requirement: {
        nodes: ["ALB", "EC2", "RDS"],
        edges: [
          { source: "ALB", target: "EC2" },
          { source: "EC2", target: "RDS" },
        ],
      },
      starterNodes: ["ALB", "EC2"],
      starterEdges: [{ source: "ALB", target: "EC2" }],
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
      successMessage: "Good. You completed the static delivery pattern.",
      hint: "CloudFront often needs an origin for static website files.",
      requirement: {
        nodes: ["CloudFront", "S3"],
        edges: [{ source: "CloudFront", target: "S3" }],
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
      successMessage: "Nice. You completed the event-driven processing flow.",
      hint: "Think of a storage service that can emit an event to Lambda.",
      requirement: {
        nodes: ["S3", "Lambda"],
        edges: [{ source: "S3", target: "Lambda" }],
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
      successMessage: "Good work. You completed a CloudFront-backed API entry path.",
      hint:
        "CloudFront can sit in front of an API service, not only in front of storage.",
      requirement: {
        nodes: ["CloudFront", "API Gateway"],
        edges: [{ source: "CloudFront", target: "API Gateway" }],
      },
      starterNodes: ["CloudFront"],
      starterEdges: [],
    },
  ];

  const fixBrokenArchitectures: ArchitectureExercise[] = [
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
          { source: "API Gateway", target: "Lambda" },
          { source: "Lambda", target: "RDS" },
        ],
      },
      starterNodes: ["API Gateway", "RDS"],
      starterEdges: [{ source: "API Gateway", target: "RDS" }],
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
          { source: "CloudFront", target: "API Gateway" },
          { source: "API Gateway", target: "Lambda" },
          { source: "Lambda", target: "RDS" },
        ],
      },
      starterNodes: ["CloudFront", "RDS"],
      starterEdges: [{ source: "CloudFront", target: "RDS" }],
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
          { source: "CloudFront", target: "API Gateway" },
          { source: "API Gateway", target: "Lambda" },
          { source: "Lambda", target: "DynamoDB" },
        ],
      },
      starterNodes: ["DynamoDB", "CloudFront"],
      starterEdges: [{ source: "DynamoDB", target: "CloudFront" }],
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
        edges: [{ source: "EC2", target: "S3" }],
      },
      starterNodes: ["S3", "EC2"],
      starterEdges: [{ source: "S3", target: "EC2" }],
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
      successMessage: "Well done. You corrected the database access direction.",
      hint:
        "The application layer usually consumes the database, not the other way around.",
      requirement: {
        nodes: ["EC2", "RDS"],
        edges: [{ source: "EC2", target: "RDS" }],
      },
      starterNodes: ["RDS", "EC2"],
      starterEdges: [{ source: "RDS", target: "EC2" }],
    },
  ];

  return {
    build_patterns: buildPatterns,
    complete_patterns: completePatterns,
    fix_broken_architectures: fixBrokenArchitectures,
  } satisfies Record<ExerciseCategoryId, ArchitectureExercise[]>;
}

function buildExerciseCanvas(exercise: ArchitectureExercise) {
  const starterLabels =
    exercise.starterNodes && exercise.starterNodes.length > 0
      ? exercise.starterNodes
      : [];

  const starterNodes: Node[] = starterLabels.map((label, index) => ({
    id: `exercise-${label.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    type: "awsService",
    position: {
      x: 90 + index * 280,
      y: 180,
    },
    data: {
      label,
      icon: getServiceIcon(label),
    },
  }));

  const nodeIdByLabel = new Map<string, string>();
  starterNodes.forEach((node) => {
    nodeIdByLabel.set(String(node.data?.label ?? ""), node.id);
  });

  const starterEdges: Edge[] = (exercise.starterEdges ?? [])
    .map((edge) => {
      const sourceId = nodeIdByLabel.get(edge.source);
      const targetId = nodeIdByLabel.get(edge.target);

      if (!sourceId || !targetId) {
        return null;
      }

      return createEdgeFromLabels(sourceId, targetId, edge.source, edge.target);
    })
    .filter((edge): edge is Edge => edge !== null);

  return {
    nodes: starterNodes,
    edges: starterEdges,
  };
}

function createInitialExercisePools() {
  return getExerciseLibrary();
}

function getRandomExercise(exercises: ArchitectureExercise[]) {
  const index = Math.floor(Math.random() * exercises.length);
  return {
    exercise: exercises[index],
    remaining: exercises.filter((_, currentIndex) => currentIndex !== index),
  };
}

function normalizeNodeLabels(nodes: Node[]) {
  return Array.from(
    new Set(nodes.map((node) => String(node.data?.label ?? "")))
  ).sort();
}

function normalizeEdgeLabels(nodes: Node[], edges: Edge[]) {
  const labelById = new Map<string, string>();
  nodes.forEach((node) => {
    labelById.set(node.id, String(node.data?.label ?? ""));
  });

  return Array.from(
    new Set(
      edges.map((edge) => {
        const source = labelById.get(edge.source) ?? "";
        const target = labelById.get(edge.target) ?? "";
        return `${source}->${target}`;
      })
    )
  ).sort();
}

function includesAll(required: string[], current: string[]) {
  return required.every((item) => current.includes(item));
}

function isExerciseSolved(
  exercise: ArchitectureExercise | null,
  nodes: Node[],
  edges: Edge[]
) {
  if (!exercise) {
    return false;
  }

  const requiredNodes = [...exercise.requirement.nodes].sort();
  const requiredEdges = [...exercise.requirement.edges]
    .map((edge) => `${edge.source}->${edge.target}`)
    .sort();

  const currentNodes = normalizeNodeLabels(nodes);
  const currentEdges = normalizeEdgeLabels(nodes, edges);

  const hasRequiredNodes = includesAll(requiredNodes, currentNodes);
  const hasRequiredEdges = includesAll(requiredEdges, currentEdges);

  if (!hasRequiredNodes || !hasRequiredEdges) {
    return false;
  }

  if (exercise.mode === "fix" && exercise.starterEdges && exercise.starterEdges.length > 0) {
    const forbiddenStarterEdges = exercise.starterEdges.map(
      (edge) => `${edge.source}->${edge.target}`
    );

    const stillHasBrokenStarterEdge = forbiddenStarterEdges.some((edgeLabel) =>
      currentEdges.includes(edgeLabel)
    );

    if (stillHasBrokenStarterEdge) {
      return false;
    }
  }

  return true;
}

function BuilderCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isTrashActive, setIsTrashActive] = useState(false);
  const [showFixSuggestions, setShowFixSuggestions] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightTone, setHighlightTone] = useState<HighlightTone>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ArchitectureExercise | null>(null);
  const [exercisePools, setExercisePools] = useState<
    Record<ExerciseCategoryId, ArchitectureExercise[]>
  >(createInitialExercisePools);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FlowFeedback>({
    tone: "info",
    title: "Build your architecture",
    message:
      "Drag AWS services onto the canvas. Create connections by dragging from the right handle of one service to the left handle of another.",
    suggestion:
      "Pick a practice category on the left to start a guided exercise.",
    fixOptions: [],
  });

  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const trashZoneRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (!flowWrapperRef.current) {
      return;
    }

    const updateCanvasSize = () => {
      if (!flowWrapperRef.current) {
        return;
      }

      const rect = flowWrapperRef.current.getBoundingClientRect();
      setCanvasSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateCanvasSize();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      setCanvasSize({
        width,
        height,
      });
    });

    observer.observe(flowWrapperRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const validationResult = useMemo(
    () => validateArchitecture(nodes, edges),
    [nodes, edges]
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const exerciseSolved = useMemo(
    () => isExerciseSolved(currentExercise, nodes, edges),
    [currentExercise, nodes, edges]
  );

  const nodeExtent = useMemo(() => {
    if (!canvasSize) {
      return undefined;
    }

    return [
      [8, 8],
      [
        Math.max(canvasSize.width - 40, 120),
        Math.max(canvasSize.height - 40, 120),
      ],
    ] as [[number, number], [number, number]];
  }, [canvasSize]);

  const translateExtent = useMemo(() => {
    if (!canvasSize) {
      return undefined;
    }

    return [
      [0, 0],
      [Math.max(canvasSize.width, 320), Math.max(canvasSize.height, 220)],
    ] as [[number, number], [number, number]];
  }, [canvasSize]);

  const flashTemplateNodes = useCallback((nodeIds: string[]) => {
    if (highlightTimeoutRef.current !== null) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    setHighlightedNodeIds(nodeIds);
    setHighlightTone("template");

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedNodeIds([]);
      setHighlightTone(null);
      highlightTimeoutRef.current = null;
    }, 1200);
  }, []);

  const renderedNodes = useMemo(() => {
    return nodes.map((node) => {
      const classNames: string[] = [];

      if (highlightTone === "template" && highlightedNodeIds.includes(node.id)) {
        classNames.push("node-state--template");
      }

      if (selectedNodeId === node.id) {
        classNames.push("node-state--selected");
      }

      return {
        ...node,
        className: classNames.join(" "),
      };
    });
  }, [nodes, highlightedNodeIds, highlightTone, selectedNodeId]);

  useEffect(() => {
    if (
      !currentExercise ||
      !exerciseSolved ||
      completedExerciseIds.includes(currentExercise.id)
    ) {
      return;
    }

    setCompletedExerciseIds((current) => current.concat(currentExercise.id));
    setFeedback({
      tone: "success",
      title: "Exercise completed",
      message: currentExercise.successMessage,
      suggestion:
        "Use the success card in the canvas to start the next random exercise in this category.",
      fixOptions: [],
    });
  }, [currentExercise, exerciseSolved, completedExerciseIds]);

  const isPointerOverTrash = useCallback((clientX: number, clientY: number) => {
    if (!trashZoneRef.current) {
      return false;
    }

    const rect = trashZoneRef.current.getBoundingClientRect();

    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }, []);

  const onNodesChange = useCallback<OnNodesChange>((changes) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback<OnEdgesChange>((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    serviceId: string
  ) => {
    event.dataTransfer.setData("application/aws-service", serviceId);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const serviceId = event.dataTransfer.getData("application/aws-service");
      const service = awsServices.find((item) => item.id === serviceId);

      if (!service) {
        return;
      }

      const rawPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const position =
        nodeExtent === undefined
          ? rawPosition
          : {
              x: Math.max(nodeExtent[0][0], Math.min(rawPosition.x, nodeExtent[1][0])),
              y: Math.max(nodeExtent[0][1], Math.min(rawPosition.y, nodeExtent[1][1])),
            };

      const newNode: Node = {
        id: `${service.id}-${Date.now()}`,
        type: "awsService",
        position,
        data: {
          label: service.label,
          icon: service.icon,
        },
      };

      setNodes((currentNodes) => currentNodes.concat(newNode));
      setSelectedNodeId(newNode.id);
      setShowFixSuggestions(false);
      setFeedback({
        tone: "success",
        title: "Service added",
        message: `${service.label} was placed on the canvas as a ${getServiceRoleHint(
          service.label
        )}.`,
        suggestion:
          "Click the service to inspect its role in the guide on the right, or connect it to define an architecture flow.",
        fixOptions: [],
      });
    },
    [screenToFlowPosition, nodeExtent]
  );

  const startExercise = useCallback((categoryId: ExerciseCategoryId) => {
    if (currentExercise && !exerciseSolved) {
      setFeedback({
        tone: "warning",
        title: "Finish the current exercise first",
        message:
          "A practice task is already active. Solve it first or leave practice mode before starting another one.",
        suggestion:
          "Complete the goal shown on the left, or use Free build mode to exit the current exercise.",
        fixOptions: [],
      });
      return;
    }

    const availableExercises = exercisePools[categoryId];

    if (!availableExercises || availableExercises.length === 0) {
      setCurrentExercise(null);
      setFeedback({
        tone: "info",
        title: "Category completed",
        message:
          "All 5 exercises in this category are completed for the current session.",
        suggestion:
          "Reset the canvas to refresh all categories, or switch to a different practice category.",
        fixOptions: [],
      });
      return;
    }

    const { exercise, remaining } = getRandomExercise(availableExercises);

    setExercisePools((currentPools) => ({
      ...currentPools,
      [categoryId]: remaining,
    }));

    const exerciseCanvas = buildExerciseCanvas(exercise);

    setNodes(exerciseCanvas.nodes);
    setEdges(exerciseCanvas.edges);
    setSelectedNodeId(exerciseCanvas.nodes[0]?.id ?? null);
    setCurrentExercise(exercise);
    setShowFixSuggestions(false);
    setFeedback({
      tone: "info",
      title: `Practice: ${exercise.title}`,
      message: exercise.instruction,
      suggestion: `Hint: ${exercise.hint}`,
      fixOptions: [],
    });

    flashTemplateNodes(exerciseCanvas.nodes.map((node) => node.id));
  }, [currentExercise, exerciseSolved, exercisePools, flashTemplateNodes]);

  const startNextExerciseInSameCategory = useCallback(() => {
    if (!currentExercise || !exerciseSolved) {
      return;
    }

    startExercise(currentExercise.categoryId);
  }, [currentExercise, exerciseSolved, startExercise]);

  const exitPracticeMode = useCallback(() => {
    setCurrentExercise(null);
    setFeedback({
      tone: "info",
      title: "Free build mode",
      message:
        "Practice mode was closed. You can continue building freely on the current canvas.",
      suggestion:
        "Use the current architecture as a base, reset the canvas, or start another practice category later.",
      fixOptions: [],
    });
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const label = String(node.data?.label ?? "Service");
    setSelectedNodeId(node.id);
    setShowFixSuggestions(false);
    setFeedback({
      tone: "info",
      title: `${label} selected`,
      message: `${label} is now the current focus service.`,
      suggestion:
        "Check the Architecture guide on the right for role, common use, and likely next services.",
      fixOptions: [],
    });
  }, []);

  const onConnect = useCallback<OnConnect>(
    (connection: Connection) => {
      const sourceNodeId = connection.source;
      const targetNodeId = connection.target;

      if (!sourceNodeId || !targetNodeId) {
        return;
      }

      if (sourceNodeId === targetNodeId) {
        setShowFixSuggestions(false);
        setFeedback({
          tone: "error",
          title: "Connection rejected",
          message: "A service cannot connect to itself.",
          suggestion: "Connect this service to a different AWS service.",
          fixOptions: [],
        });
        return;
      }

      const alreadyExists = edges.some(
        (edge) =>
          edge.source === sourceNodeId &&
          edge.target === targetNodeId &&
          edge.sourceHandle === (connection.sourceHandle ?? "source") &&
          edge.targetHandle === (connection.targetHandle ?? "target")
      );

      if (alreadyExists) {
        setShowFixSuggestions(false);
        setFeedback({
          tone: "warning",
          title: "Connection already exists",
          message: "These two services are already connected in this direction.",
          suggestion:
            "Delete the existing line first if you want to redraw it or replace it with another path.",
          fixOptions: [],
        });
        return;
      }

      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const targetNode = nodes.find((node) => node.id === targetNodeId);

      if (!sourceNode || !targetNode) {
        return;
      }

      const sourceLabel = String(sourceNode.data?.label ?? "");
      const targetLabel = String(targetNode.data?.label ?? "");

      const verdict = getConnectionVerdict(sourceLabel, targetLabel);
      const fixOptions =
        verdict.severity === "warning" || verdict.severity === "rejected"
          ? getSuggestedFixes(sourceLabel, targetLabel)
          : [];

      const meaningText = getConnectionMeaning(
        sourceLabel,
        targetLabel,
        verdict.flowType
      );

      setShowFixSuggestions(false);

      if (verdict.severity === "rejected") {
        setFeedback({
          tone: "error",
          title: "Connection rejected",
          message: `${verdict.message} ${meaningText}`,
          suggestion: verdict.suggestion,
          fixOptions,
        });
        return;
      }

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

      const newEdge: Edge = {
        id: `${sourceNodeId}-${targetNodeId}-${Date.now()}`,
        source: sourceNodeId,
        target: targetNodeId,
        sourceHandle: connection.sourceHandle ?? "source",
        targetHandle: connection.targetHandle ?? "target",
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

      setEdges((currentEdges) => addEdge(newEdge, currentEdges));
      setSelectedNodeId(targetNodeId);

      if (verdict.severity === "warning") {
        setFeedback({
          tone: "warning",
          title: "Connection added with review",
          message: `${verdict.message} ${meaningText}`,
          suggestion: verdict.suggestion,
          fixOptions,
        });
        return;
      }

      setFeedback({
        tone: "success",
        title: "Connection accepted",
        message: `${verdict.message} ${meaningText}`,
        suggestion:
          "This connection now helps define the current architecture pattern shown in the guide on the right.",
        fixOptions: [],
      });
    },
    [edges, nodes]
  );

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    const sourceLabel = String(sourceNode?.data?.label ?? "Source");
    const targetLabel = String(targetNode?.data?.label ?? "Target");

    setEdges((currentEdges) =>
      currentEdges.filter((currentEdge) => currentEdge.id !== edge.id)
    );
    setShowFixSuggestions(false);
    setFeedback({
      tone: "warning",
      title: "Connection removed",
      message: `${sourceLabel} → ${targetLabel} was removed from the architecture.`,
      suggestion:
        "Redraw it if you still want that relationship, or replace it with a more typical path.",
      fixOptions: [],
    });
  }, [nodes]);

  const onNodeDrag: NodeMouseHandler = useCallback(
    (event) => {
      setIsTrashActive(isPointerOverTrash(event.clientX, event.clientY));
    },
    [isPointerOverTrash]
  );

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (event, node) => {
      const droppedOnTrash = isPointerOverTrash(event.clientX, event.clientY);

      setIsTrashActive(false);

      if (!droppedOnTrash) {
        return;
      }

      setNodes((currentNodes) =>
        currentNodes.filter((currentNode) => currentNode.id !== node.id)
      );

      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => edge.source !== node.id && edge.target !== node.id
        )
      );

      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
      }

      setShowFixSuggestions(false);
      setFeedback({
        tone: "warning",
        title: "Service removed",
        message: `${String(node.data?.label ?? "Service")} was removed from the canvas.`,
        suggestion:
          "This service and all of its visible relationships were removed from the architecture.",
        fixOptions: [],
      });
    },
    [isPointerOverTrash, selectedNodeId]
  );

  const handleResetCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setIsTrashActive(false);
    setShowFixSuggestions(false);
    setHighlightedNodeIds([]);
    setHighlightTone(null);
    setSelectedNodeId(null);
    setCurrentExercise(null);
    setExercisePools(createInitialExercisePools());
    setCompletedExerciseIds([]);
    setFeedback({
      tone: "info",
      title: "Canvas cleared",
      message: "All services, connections, and exercise state were reset.",
      suggestion:
        "Start from scratch or begin a fresh practice category with a full task pool.",
      fixOptions: [],
    });
  }, []);

  const handleToggleFixSuggestions = useCallback(() => {
    setShowFixSuggestions((current) => !current);
  }, []);

  const completedCounts = useMemo(() => {
    const allExercises = getExerciseLibrary();

    return exerciseCategories.reduce<Record<ExerciseCategoryId, number>>(
      (acc, category) => {
        acc[category.id] = allExercises[category.id].filter((exercise) =>
          completedExerciseIds.includes(exercise.id)
        ).length;
        return acc;
      },
      {
        build_patterns: 0,
        complete_patterns: 0,
        fix_broken_architectures: 0,
      }
    );
  }, [completedExerciseIds]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1>AWS Builder</h1>
        <p className="sidebar-text">
          Drag services from the top bar onto the canvas and solve guided AWS architecture exercises.
        </p>

        <div className="practice-section">
          <div className="practice-section__title">Practice</div>
          <div className="practice-list">
            {exerciseCategories.map((category) => {
              const remaining = exercisePools[category.id]?.length ?? 0;
              const completed = completedCounts[category.id] ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  className="practice-card"
                  onClick={() => startExercise(category.id)}
                >
                  <span className="practice-card__name">{category.title}</span>
                  <span className="practice-card__description">
                    {category.description}
                  </span>
                  <span className="practice-card__meta">
                    Completed: {completed}/5
                  </span>
                  <span className="practice-card__meta">
                    Remaining: {remaining}/5
                  </span>
                </button>
              );
            })}
          </div>

          <div className="practice-current">
            <div className="practice-current__title">Current exercise</div>

            {!currentExercise ? (
              <p className="practice-current__empty">
                No active exercise. Pick a practice category to start a random task.
              </p>
            ) : (
              <>
                <div className="practice-current__name">{currentExercise.title}</div>
                <p className="practice-current__text">
                  {currentExercise.instruction}
                </p>
                <p className="practice-current__hint">
                  Hint: {currentExercise.hint}
                </p>

                <button
                  type="button"
                  className="practice-current__button"
                  onClick={exitPracticeMode}
                >
                  Free build mode
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="center-column">
        <section className="canvas-section">
          <div className="canvas-header">
            <div className="canvas-header__text">
              <h2>Architecture Canvas</h2>
              <p>Use the service bar above the canvas to drag AWS services into your architecture.</p>
              <p className="canvas-hint">
                Drag from the right connector to the left connector to create a
                connection. Click a line to delete it.
              </p>
            </div>

            <div className="canvas-header__actions">
              <button
                type="button"
                className="reset-button"
                onClick={handleResetCanvas}
              >
                Reset canvas
              </button>
            </div>
          </div>

          <div className="canvas-service-strip">
            <div className="canvas-service-strip__title">Service palette</div>
            <div className="canvas-service-strip__list">
              {awsServices.map((service) => (
                <div
                  key={service.id}
                  className="canvas-service-card"
                  draggable
                  onDragStart={(event) => onDragStart(event, service.id)}
                >
                  <img
                    src={service.icon}
                    alt={service.label}
                    className="canvas-service-card__icon"
                  />
                  <span>{service.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flow-wrapper"
            ref={flowWrapperRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={renderedNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              fitView={false}
              minZoom={0.9}
              maxZoom={1.08}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              panOnScroll={false}
              translateExtent={translateExtent}
              nodeExtent={nodeExtent}
              nodesConnectable={true}
              elementsSelectable={true}
            >
              <Controls />
              <Background />
            </ReactFlow>

            {currentExercise && exerciseSolved ? (
              <div className="exercise-success-overlay">
                <div className="exercise-success-card">
                  <div className="exercise-success-card__badge">Exercise completed</div>
                  <h3>{currentExercise.successMessage}</h3>
                  <p>
                    You solved <strong>{currentExercise.title}</strong>.
                  </p>
                  <button
                    type="button"
                    className="exercise-success-card__button"
                    onClick={startNextExerciseInSameCategory}
                  >
                    Start next random exercise
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flow-legend">
              <div className="flow-legend__title">Flow meaning</div>

              <div className="flow-legend__item">
                <span className="flow-legend__line flow-legend__line--request" />
                <span>Request / public entry path</span>
              </div>

              <div className="flow-legend__item">
                <span className="flow-legend__line flow-legend__line--data" />
                <span>Application to data / storage</span>
              </div>

              <div className="flow-legend__item">
                <span className="flow-legend__line flow-legend__line--event" />
                <span>Event or trigger relationship</span>
              </div>

              <div className="flow-legend__item">
                <span className="flow-legend__line flow-legend__line--warning" />
                <span>Works, but should be reviewed</span>
              </div>
            </div>

            <div
              ref={trashZoneRef}
              className={`trash-zone ${isTrashActive ? "trash-zone--active" : ""}`}
            >
              <div className="trash-zone__icon">🗑️</div>
              <div className="trash-zone__label">Drop here to delete</div>
            </div>
          </div>
        </section>

        <FlowFeedbackPanel
          feedback={feedback}
          showFixSuggestions={showFixSuggestions}
          onShowFixSuggestions={handleToggleFixSuggestions}
        />
      </div>

      <ValidationPanel
        nodes={nodes}
        edges={edges}
        result={validationResult}
        selectedNode={selectedNode}
      />
    </main>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <BuilderCanvas />
    </ReactFlowProvider>
  );
}

export default App;
