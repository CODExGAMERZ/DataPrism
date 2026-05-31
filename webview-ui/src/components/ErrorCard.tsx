interface Props {
  message: string;
  stage?: string;
  onRetry?: () => void;
}

export default function ErrorCard({ message, stage, onRetry }: Props) {
  return (
    <div className="error-card">
      <div className="error-icon">⚠️</div>
      <div className="error-title">
        {stage ? `Error during ${stage}` : "Analysis Error"}
      </div>
      <div className="error-message">{message}</div>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          ↻ Retry Analysis
        </button>
      )}
    </div>
  );
}
