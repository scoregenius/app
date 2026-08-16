// frontend/src/components/ui/skeleton_box.tsx
//
// Shared loading placeholder. Sized by the caller; the surface comes from
// `.skel` in index.css, which is the panel-2/line shimmer §6.8 specifies.
//
// Previously `animate-pulse bg-slate-700/50` — a dark-only value with no light
// variant, so all six consumers drew mid-grey bars on a white page (defect 59).
// The shimmer stops under `prefers-reduced-motion` via the app-wide rule near
// the top of index.css, so there is no local media query here.

const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`skel rounded ${className ?? ""}`} aria-hidden="true" />
);
export default SkeletonBox;
