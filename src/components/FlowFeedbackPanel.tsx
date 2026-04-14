interface FlowFeedback {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  suggestion?: string;
  fixOptions?: string[];
}

interface FlowFeedbackPanelProps {
  feedback: FlowFeedback;
  showFixSuggestions: boolean;
  onShowFixSuggestions: () => void;
}

function FlowFeedbackPanel({
  feedback,
  showFixSuggestions,
  onShowFixSuggestions,
}: FlowFeedbackPanelProps) {
  const hasFixOptions = Boolean(feedback.fixOptions && feedback.fixOptions.length > 0);

  return (
    <section className="flow-feedback-panel">
      <div className={`flow-feedback-panel__badge flow-feedback-panel__badge--${feedback.tone}`}>
        {feedback.title}
      </div>

      <div className="flow-feedback-panel__content">
        <p className="flow-feedback-panel__message">{feedback.message}</p>

        {feedback.suggestion ? (
          <p className="flow-feedback-panel__suggestion">
            <strong>Suggestion:</strong> {feedback.suggestion}
          </p>
        ) : null}

        {hasFixOptions ? (
          <div className="flow-feedback-panel__fixes">
            <button
              type="button"
              className="flow-feedback-panel__button"
              onClick={onShowFixSuggestions}
            >
              {showFixSuggestions ? "Hide suggested fix" : "Suggest better path"}
            </button>

            {showFixSuggestions ? (
              <ul className="flow-feedback-panel__fix-list">
                {feedback.fixOptions?.map((fix) => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default FlowFeedbackPanel;
