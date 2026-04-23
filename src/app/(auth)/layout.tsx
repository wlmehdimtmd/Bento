export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-[var(--color-cream)] px-4 py-6 dark:bg-[var(--color-charcoal)] sm:min-h-screen sm:items-center sm:py-12">
      {children}
    </main>
  );
}
