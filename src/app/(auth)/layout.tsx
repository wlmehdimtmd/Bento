export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] dark:bg-[var(--color-charcoal)] px-4 py-12">
      {children}
    </main>
  );
}
