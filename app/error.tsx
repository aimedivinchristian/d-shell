"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-5 font-mono text-[#e8e8e8] antialiased">
        <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#131313] p-6 text-sm">
          <p className="text-[#22d3ee]">$ ./d-shell</p>
          <p className="mt-2 text-red-400">
            Uncaught exception{error.digest ? ` (${error.digest})` : ""}
          </p>
          <p className="mt-4 text-[#8a8a8a]">
            Something broke on our end, not yours. Try again — it usually clears up.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#e8e8e8] transition-colors hover:border-[#22d3ee]"
          >
            retry
          </button>
        </div>
      </body>
    </html>
  );
}
