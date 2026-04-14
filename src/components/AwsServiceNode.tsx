import { Handle, Position, type NodeProps } from "reactflow";

type AwsNodeData = {
  label: string;
  icon: string;
};

function AwsServiceNode({ data }: NodeProps) {
  const nodeData = data as AwsNodeData;

  return (
    <div className="aws-node">
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        className="aws-node__handle aws-node__handle--target"
      />

      <div className="aws-node__icon-wrap">
        <img
          src={nodeData.icon}
          alt={nodeData.label}
          className="aws-node__icon"
        />
      </div>

      <div className="aws-node__content">
        <div className="aws-node__title">{nodeData.label}</div>
        <div className="aws-node__subtitle">AWS Service</div>
      </div>

      <Handle
        id="source"
        type="source"
        position={Position.Right}
        className="aws-node__handle aws-node__handle--source"
      />
    </div>
  );
}

export default AwsServiceNode;
