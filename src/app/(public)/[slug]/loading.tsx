import { BentoGridSkeleton } from "@/components/ui/BentoSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicStoreLoading() {
  return (
    <div className="mx-auto max-w-5xl px-0 py-8 space-y-6 sm:px-4">
      {/* Header placeholder */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      <BentoGridSkeleton />
    </div>
  );
}
