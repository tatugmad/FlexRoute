import { HeadingButton } from "@/components/navigation/HeadingButton";
import { ZoomButton } from "@/components/navigation/ZoomButton";
import { FollowButton } from "@/components/navigation/FollowButton";
import { SimButton } from "@/components/navigation/SimButton";

export function NavControls() {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 items-end pointer-events-none z-10">
      <HeadingButton />
      <ZoomButton />
      <FollowButton />
      <div className="mt-3">
        <SimButton />
      </div>
    </div>
  );
}
