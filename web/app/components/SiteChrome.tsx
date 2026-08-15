import Link from "next/link";

export function Mark() {
  return <span className="font-display text-xl italic tracking-tight">Bagrry</span>;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-md">
      <Link href="/">
        <Mark />
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-[#5c574f] md:flex">
        <Link href="/#product">Product</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/integrations">Integrations</Link>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <Link href="/download" className="hidden text-[#5c574f] sm:inline">
          Sign in
        </Link>
        <Link
          href="/download"
          className="rounded-full bg-[#5b6f00] px-5 py-2 text-[#f7f7f2] hover:bg-[#4a5a00]"
        >
          Download
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#ece7db] px-6 py-10 text-center text-xs text-[#8a847a]">
      <p>Bagrry · notes on your machine · no meeting bot</p>
      <p className="mt-2">
        <Link href="/pricing" className="underline-offset-4 hover:underline">
          Pricing
        </Link>
        {" · "}
        <Link href="/integrations" className="underline-offset-4 hover:underline">
          Integrations
        </Link>
        {" · "}
        <Link href="/download" className="underline-offset-4 hover:underline">
          Download
        </Link>
      </p>
    </footer>
  );
}
