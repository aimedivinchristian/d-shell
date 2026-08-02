import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center gap-4 px-5 sm:px-8">
        <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 font-mono text-sm">
          <p className="text-accent">$ ls</p>
          <p className="mt-2 text-red-400">ls: cannot access this page: No such file or directory</p>
          <p className="mt-4 text-muted">
            That path doesn&apos;t exist. Head back to{" "}
            <Link href="/" className="text-accent underline underline-offset-4 hover:text-foreground">
              the home directory
            </Link>
            .
          </p>
        </div>
      </main>
      <footer className="border-t border-border px-5 py-6 sm:px-8">
        <p className="font-mono text-xs text-muted">D&gt;shell — a Space D project</p>
      </footer>
    </div>
  );
}
