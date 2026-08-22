export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </header>
  );
}
