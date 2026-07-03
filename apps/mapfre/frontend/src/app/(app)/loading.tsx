export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl border border-primary/10 bg-card/30 p-6 sm:p-10 lg:p-14">
        <div className="h-5 w-28 rounded-full bg-muted/40" />
        <div className="mt-5 h-10 w-3/4 rounded-lg bg-muted/30 sm:h-12 lg:h-14" />
        <div className="mt-4 h-4 w-1/2 rounded bg-muted/20" />
        <div className="mt-8 flex gap-3">
          <div className="h-11 w-36 rounded-xl bg-muted/30" />
          <div className="h-11 w-36 rounded-xl bg-muted/20" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/20 bg-card/40 p-5">
            <div className="h-11 w-11 rounded-xl bg-muted/30" />
            <div className="mt-4 h-4 w-2/3 rounded bg-muted/20" />
            <div className="mt-2 h-3 w-full rounded bg-muted/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
