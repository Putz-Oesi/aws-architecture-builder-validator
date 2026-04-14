import type { Edge, Node } from "reactflow";
import type { ValidationResult } from "../utils/validateArchitecture";

interface ValidationPanelProps {
  nodes: Node[];
  edges: Edge[];
  result: ValidationResult;
  selectedNode: Node | null;
}

interface NodeGuide {
  role: string;
  commonUse: string;
  nextServices: string[];
}

function getNodeGuide(label: string): NodeGuide {
  const guides: Record<string, NodeGuide> = {
    S3: {
      role: "Object storage for files, static assets, logs, backups, or uploads.",
      commonUse:
        "Often used behind static websites, file workflows, or event-driven processing.",
      nextServices: ["CloudFront", "Lambda", "EC2"],
    },
    CloudFront: {
      role: "Global edge delivery layer for fast content distribution.",
      commonUse:
        "Usually placed in front of S3, API Gateway, or an application origin to improve delivery and caching.",
      nextServices: ["S3", "API Gateway"],
    },
    "API Gateway": {
      role: "Public API entry point for request routing and integration.",
      commonUse:
        "Commonly used in serverless APIs where API Gateway receives requests and Lambda handles the logic.",
      nextServices: ["Lambda", "EC2"],
    },
    Lambda: {
      role: "Compute layer for event-driven or request-driven application logic.",
      commonUse:
        "Often connects API, storage, or database services without managing servers directly.",
      nextServices: ["DynamoDB", "S3", "RDS"],
    },
    DynamoDB: {
      role: "Managed NoSQL database for key-value and document workloads.",
      commonUse:
        "Frequently used in serverless applications for fast application data access.",
      nextServices: ["Lambda", "EC2"],
    },
    EC2: {
      role: "Virtual compute layer for applications that need instance-based runtime control.",
      commonUse:
        "Often used for web apps, background workers, or systems that need custom OS or runtime setup.",
      nextServices: ["RDS", "S3", "ALB"],
    },
    ALB: {
      role: "Load balancing layer for HTTP or HTTPS traffic.",
      commonUse:
        "Commonly used in front of EC2 or Lambda to distribute application traffic.",
      nextServices: ["EC2", "Lambda"],
    },
    RDS: {
      role: "Managed relational database layer.",
      commonUse:
        "Usually consumed by application services such as EC2 or Lambda for structured data access.",
      nextServices: ["EC2", "Lambda"],
    },
  };

  return (
    guides[label] ?? {
      role: "This service is part of the architecture model.",
      commonUse:
        "Review how it fits into the entry, compute, data, or delivery layer of the design.",
      nextServices: [],
    }
  );
}

function resultLooksFragmented(nodes: Node[], edges: Edge[]) {
  return nodes.length >= 3 && edges.length <= 1;
}

function getNextBestSteps(nodes: Node[], edges: Edge[], suggestions: string[]) {
  const labels = nodes.map((node) => String(node.data?.label ?? ""));
  const has = (label: string) => labels.includes(label);

  if (nodes.length === 0) {
    return [
      "Load a starter template to explore a common AWS pattern.",
      "Or drag services onto the canvas and connect them step by step.",
    ];
  }

  if (has("CloudFront") && has("S3")) {
    return [
      "This already looks like a static website delivery pattern.",
      "A common next step would be DNS, TLS, and observability around this setup.",
      "Consider Route 53, ACM / TLS, or logging and monitoring.",
    ];
  }

  if (has("API Gateway") && has("Lambda") && !has("DynamoDB") && !has("RDS")) {
    return [
      "You already have an API and compute layer.",
      "A common next step is adding a data layer such as DynamoDB or RDS.",
      "Choose DynamoDB for a serverless-friendly data store, or RDS for relational needs.",
    ];
  }

  if (has("ALB") && has("EC2") && !has("RDS")) {
    return [
      "You already have an entry and compute tier.",
      "A common next step is adding relational storage or scaling support.",
      "Consider RDS, Auto Scaling, and monitoring to round out this pattern.",
    ];
  }

  if (resultLooksFragmented(nodes, edges)) {
    return [
      "The current architecture looks fragmented.",
      "Try building around one clear main path first.",
      "Typical starting patterns are CloudFront → S3, API Gateway → Lambda, or ALB → EC2 → RDS.",
    ];
  }

  return suggestions.length > 0
    ? suggestions.slice(0, 3)
    : [
        "Review whether the current design has a clear entry layer, compute layer, and data or storage layer.",
        "A strong next step is usually to complete the main pattern before adding more services.",
      ];
}

function getCurrentPatternText(result: ValidationResult, nodes: Node[]) {
  if (nodes.length === 0) {
    return "No architecture pattern yet. Start with a template or drag services onto the canvas.";
  }

  if (result.detectedPatterns.length > 0) {
    return result.detectedPatterns[0];
  }

  if (nodes.length === 1) {
    return "Single service on canvas. Add another service to start defining a pattern.";
  }

  return "No clear architecture pattern detected yet.";
}

function ValidationPanel({
  nodes,
  edges,
  result,
  selectedNode,
}: ValidationPanelProps) {
  const currentPattern = getCurrentPatternText(result, nodes);
  const nextSteps = getNextBestSteps(nodes, edges, result.suggestions);

  const selectedLabel = selectedNode
    ? String(selectedNode.data?.label ?? "Service")
    : null;

  const selectedGuide = selectedLabel ? getNodeGuide(selectedLabel) : null;

  return (
    <aside className="validation-panel">
      <div className="validation-panel__header">
        <h2>Architecture guide</h2>
        <div
          className={`status-badge status-badge--${result.status
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {result.status}
        </div>
      </div>

      <section className="validation-section">
        <h3>Current pattern</h3>
        <p>{currentPattern}</p>
      </section>

      <section className="validation-section">
        <h3>Next best step</h3>
        <ul>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <section className="validation-section">
        <h3>Selected service</h3>
        {!selectedGuide || !selectedLabel ? (
          <p>
            Click a service on the canvas to inspect its role, common usage,
            and likely next services.
          </p>
        ) : (
          <div className="validation-inspector">
            <div className="validation-inspector__title">{selectedLabel}</div>
            <p>
              <strong>Role:</strong> {selectedGuide.role}
            </p>
            <p>
              <strong>Common use:</strong> {selectedGuide.commonUse}
            </p>

            {selectedGuide.nextServices.length > 0 ? (
              <>
                <p>
                  <strong>Often connects to:</strong>
                </p>
                <ul className="validation-chip-list">
                  {selectedGuide.nextServices.map((service) => (
                    <li
                      key={service}
                      className="validation-chip validation-chip--service"
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        )}
      </section>
    </aside>
  );
}

export default ValidationPanel;
