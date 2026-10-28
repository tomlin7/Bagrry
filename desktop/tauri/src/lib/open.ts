import { isTauri } from "./tauri";

/** Opens a URL in the system browser, falling back to `window.open` in Vite. */
export async function openExternal(url: string) {
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Lets the user pick one file; returns its text contents. */
export function pickTextFile(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      file.text().then(
        (text) => resolve({ name: file.name, text }),
        () => resolve(null),
      );
    };
    input.click();
  });
}

/** Lets the user pick several files (markdown/text) for note import. */
export function pickTextFiles(accept: string): Promise<{ name: string; text: string }[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      const notes = await Promise.all(
        files.map(async (file) => ({ name: file.name, text: await file.text() })),
      );
      resolve(notes);
    };
    input.click();
  });
}
