export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e2e8f0]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-[#e2e8f0] rounded w-1/3" />
          <div className="h-3 bg-[#f1f5f9] rounded w-1/4" />
        </div>
      </div>
      <div className="h-8 bg-[#e2e8f0] rounded w-1/2" />
      <div className="h-3 bg-[#f1f5f9] rounded w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-[#e2e8f0] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[#e2e8f0]" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#e2e8f0] rounded w-2/3" />
            <div className="h-3 bg-[#f1f5f9] rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-end gap-3 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 bg-[#e2e8f0] rounded-t-lg" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonAuthForm() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#e2e8f0]" />
          <div className="h-6 bg-[#e2e8f0] rounded w-32" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#e2e8f0] rounded w-48 mx-auto" />
          <div className="h-4 bg-[#f1f5f9] rounded w-56 mx-auto" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="space-y-1">
            <div className="h-3 bg-[#f1f5f9] rounded w-24" />
            <div className="h-14 bg-white border border-[#e2e8f0] rounded-2xl" />
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-[#f1f5f9] rounded w-20" />
            <div className="h-14 bg-white border border-[#e2e8f0] rounded-2xl" />
          </div>
          <div className="h-14 bg-[#e2e8f0] rounded-2xl" />
        </div>
        <div className="animate-pulse flex items-center gap-4">
          <div className="flex-1 h-px bg-[#e2e8f0]" />
          <div className="h-4 bg-[#f1f5f9] rounded w-32" />
          <div className="flex-1 h-px bg-[#e2e8f0]" />
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-white border border-[#e2e8f0] rounded-2xl" />
          <div className="h-12 bg-white border border-[#e2e8f0] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonSettings() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-6 md:p-10 my-12 animate-pulse">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#e2e8f0]" />
          <div className="space-y-2">
            <div className="h-7 bg-[#e2e8f0] rounded w-36" />
            <div className="h-4 bg-[#f1f5f9] rounded w-48" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="h-5 bg-[#e2e8f0] rounded w-28" />
              <div className="space-y-1">
                <div className="h-3 bg-[#f1f5f9] rounded w-20" />
                <div className="h-12 bg-white border border-[#e2e8f0] rounded-2xl" />
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-[#f1f5f9] rounded w-16" />
                <div className="h-12 bg-white border border-[#e2e8f0] rounded-2xl" />
              </div>
            </div>
          ))}
          <div className="h-12 bg-[#e2e8f0] rounded-2xl w-40" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-white p-6 md:p-12 space-y-6 max-w-7xl mx-auto">
      <div className="animate-pulse flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#e2e8f0]" />
        <div className="space-y-2">
          <div className="h-6 bg-[#e2e8f0] rounded w-48" />
          <div className="h-4 bg-[#f1f5f9] rounded w-32" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonList count={4} />
    </div>
  );
}
