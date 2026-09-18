type Size = 'sm' | 'md' | 'lg';

export function Spinner({ size = 'md' }: { size?: Size }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };
  return (
    <div
      className={`${sizes[size]} rounded-full border-current border-r-transparent animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}