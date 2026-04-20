import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] dark:bg-[var(--color-charcoal)] px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-background p-8">
        <div className="space-y-2 text-center">
          <Skeleton className="h-8 w-28 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </main>
  );
}
