import type { ChangeEvent } from "react";
import type { ArchitectureInput } from "../types/architecture";
import {
  apiLayerOptions,
  cdnOptions,
  computeOptions,
  databaseOptions,
  frontendOptions,
  priorityOptions,
  trafficOptions,
  useCaseOptions,
} from "../data/options";

interface ArchitectureFormProps {
  value: ArchitectureInput;
  onChange: (value: ArchitectureInput) => void;
  onValidate: () => void;
}

function ArchitectureForm({
  value,
  onChange,
  onValidate,
}: ArchitectureFormProps) {
  const handleSelectChange =
    (field: keyof ArchitectureInput) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...value,
        [field]: event.target.value,
      });
    };

  return (
    <section className="form-section">
      <h2>Architecture Setup</h2>

      <div className="form-grid">
        <label>
          <span>Use Case</span>
          <select value={value.useCase} onChange={handleSelectChange("useCase")}>
            {useCaseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Frontend</span>
          <select value={value.frontend} onChange={handleSelectChange("frontend")}>
            {frontendOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>CDN</span>
          <select value={value.cdn} onChange={handleSelectChange("cdn")}>
            {cdnOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>API Layer</span>
          <select value={value.apiLayer} onChange={handleSelectChange("apiLayer")}>
            {apiLayerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Compute</span>
          <select value={value.compute} onChange={handleSelectChange("compute")}>
            {computeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Database</span>
          <select value={value.database} onChange={handleSelectChange("database")}>
            {databaseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Traffic Level</span>
          <select value={value.traffic} onChange={handleSelectChange("traffic")}>
            {trafficOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select value={value.priority} onChange={handleSelectChange("priority")}>
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="button" onClick={onValidate}>
        Validate Architecture
      </button>
    </section>
  );
}

export default ArchitectureForm;
