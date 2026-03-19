import { useNavigationStore } from "@/stores/navigationStore";
import { HeadingButton } from "@/components/navigation/HeadingButton";
import { ZoomButton } from "@/components/navigation/ZoomButton";
import { FollowButton } from "@/components/navigation/FollowButton";
import { SignalZero } from "lucide-react";

export function NavControls() {
  const positionQuality = useNavigationStore((s) => s.positionQuality);

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 items-end pointer-events-none z-10">
      <HeadingButton />
      <ZoomButton />
      <FollowButton />
      {positionQuality === "lost" && (
        <button className="bg-rose-500/80 rounded-full shadow-lg border border-rose-400/50 pointer-events-auto flex items-center justify-center w-14 h-14">
          <SignalZero className="w-7 h-7 text-white" />
        </button>
      )}
    </div>
  );
}
