import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1c1914]">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5b6f00]">Desktop</p>
        <h1 className="font-display mt-2 text-5xl font-semibold">The notepad lives in the app</h1>
        <p className="mt-4 text-[#5c574f]">
          Bagrry for Windows is the Tauri client in this repo. It captures mic and system audio, stores notes
          in local SQLite, and never opens this marketing site inside the window.
        </p>
        <pre className="mt-8 overflow-x-auto rounded-2xl border border-[#e4dfd3] bg-white/70 p-4 text-left text-sm">
          {`cd desktop
npm install
npm run tauri dev`}
        </pre>
        <p className="mt-4 text-xs text-[#8a847a]">Add a Groq key in Settings for Whisper and Llama.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
