export function OrbitIcon({ size = 18, animationDuration = "3s" }: { size?: number, animationDuration?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="3" r="2" fill="currentColor">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur={animationDuration}
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
