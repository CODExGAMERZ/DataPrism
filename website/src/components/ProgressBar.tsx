interface Props {
  percent: number;
  complete: boolean;
}

export default function ProgressBar({ percent, complete }: Props) {
  return (
    <div className="progress-bar-container">
      <div
        className={`progress-bar ${complete ? "complete" : ""}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
