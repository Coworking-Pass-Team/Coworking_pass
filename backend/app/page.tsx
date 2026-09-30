export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center font-sans">
      <h1 className="text-2xl font-semibold text-zinc-900">Coworking Pass API</h1>
      <p className="max-w-md text-sm text-zinc-600">
        This service exposes the Coworking Pass REST API. The web application is served by the frontend service.
      </p>
      <a className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white" href="/api-doc">
        Open API documentation
      </a>
    </main>
  );
}
