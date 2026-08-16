import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ChevronDown, Grid2x2, Mic, Paperclip, SquareCheck } from "lucide-react";
import * as api from "@/lib/api";
import { CHAT_MODELS, DEFAULT_CHAT_MODEL } from "@/lib/models";
import { cn } from "@/lib/utils";
import { AutoTextarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { useSetting } from "@/hooks/useSetting";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The "Ask anything" composer. Used inline on space pages and docked to the
 * bottom of Home and Chat.
 */
export function AskBar({
  placeholder = "Ask anything",
  onSubmit,
  onAttach,
  busy,
  autoFocus,
  showModel = true,
  className,
}: {
  placeholder?: string;
  onSubmit: (value: string) => void;
  onAttach?: (file: { name: string; text: string }) => void;
  busy?: boolean;
  autoFocus?: boolean;
  showModel?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [model, setModel] = useSetting("chat_model", DEFAULT_CHAT_MODEL);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    onSubmit(text);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface px-3 py-2 transition-[border-color,box-shadow]",
        focused ? "border-accent shadow-md ring-2 ring-accent/20" : "border-border shadow-sm",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <AutoTextarea
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className="py-1"
      />

      <div className="mt-1 flex items-center gap-1">
        <Tooltip label="Attach a file">
          <button
            type="button"
            aria-label="Attach a file"
            className="grid size-6 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-text"
            onClick={() => {
              if (!onAttach) return;
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".md,.txt,.csv,.json,text/plain";
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) return;
                void file.text().then((text) => onAttach({ name: file.name, text }));
              };
              input.click();
            }}
          >
            <Paperclip className="size-3.5" />
          </button>
        </Tooltip>

        {showModel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-muted transition-colors hover:bg-hover hover:text-text"
              >
                {CHAT_MODELS.find((m) => m.id === model)?.label ?? "Model"}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem]">
              <DropdownMenuLabel>Model</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
                {CHAT_MODELS.map((m) => (
                  <DropdownMenuRadioItem key={m.id} value={m.id}>
                    {m.label}
                    <span className="ml-auto text-[10px] text-muted">{m.hint}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />

        <Tooltip label="Dictate">
          <button
            type="button"
            aria-label="Dictate"
            className="grid size-6 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-text"
          >
            <Mic className="size-3.5" />
          </button>
        </Tooltip>

        <button
          type="button"
          aria-label="Send"
          onClick={submit}
          disabled={!value.trim() || busy}
          className={cn(
            "grid size-6 place-items-center rounded-full transition-all",
            value.trim() && !busy
              ? "bg-solid text-solid-fg hover:bg-solid-hover"
              : "bg-hover text-subtle",
          )}
        >
          <ArrowUp className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Recipe shortcut chips shown under the composer. Falls back to nothing when
 * the recipes table is empty rather than rendering an empty row.
 */
export function RecipeChips({
  onPick,
  limit = 3,
  onSeeAll,
  className,
}: {
  onPick: (prompt: string, name: string) => void;
  limit?: number;
  onSeeAll?: () => void;
  className?: string;
}) {
  const { data: recipes = [] } = useQuery({ queryKey: api.qk.recipes(), queryFn: api.listRecipes });
  if (recipes.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {recipes.slice(0, limit).map((recipe) => (
        <button
          key={recipe.id}
          type="button"
          onClick={() => onPick(recipe.prompt_template, recipe.name)}
          className="flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          <SquareCheck className="size-3.5" />
          {recipe.name}
        </button>
      ))}
      {onSeeAll && recipes.length > limit && (
        <button
          type="button"
          onClick={onSeeAll}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-full px-2 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
        >
          <Grid2x2 className="size-3.5" />
          All recipes
        </button>
      )}
    </div>
  );
}
