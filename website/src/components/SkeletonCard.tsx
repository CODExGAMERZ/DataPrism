interface Props {
  count?: number;
}

export default function SkeletonCard({ count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </>
  );
}
