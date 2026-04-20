import { Skeleton } from "@/components/ui/skeleton";

// Landing page loading — navbar + hero shapes
export default function RootLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <div className="h-14 border-b border-border/60 flex items-center justify-between px-6">
        <Skeleton className="h-6 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
      {/* Hero */}
      <div className="mx-auto w-full max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <Skeleton className="h-5 w-48 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-4/5 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-52 rounded-lg" />
            <Skeleton className="h-11 w-44 rounded-lg" />
          </div>
        </div>
        <div className="flex justify-center">
          <Skeleton className="w-64 h-[420px] rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
