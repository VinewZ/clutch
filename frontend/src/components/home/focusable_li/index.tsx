import type { Dispatch, SetStateAction, KeyboardEvent, Ref } from "react";
import { ClutchServices, DesktopApp } from "../../../../bindings/github.com/vinewz/clutch/app/index";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { toast } from "react-toastify";

type FocusableLiProps = {
  ref: Ref<HTMLLIElement> | undefined
  focused: boolean;
  app: DesktopApp
  disabled?: boolean;
  setSearch: Dispatch<SetStateAction<string>>
};

export function FocusableLi({
  ref,
  focused,
  app,
  setSearch
}: FocusableLiProps) {
  function handleEnter(e: KeyboardEvent<HTMLLIElement>) {
    e.preventDefault()
    console.log("Key pressed:", e.key);
    if (e.key === "Enter") {
        console.log("Running app:", app.name);
      try {
        ClutchServices.ExecApp(app)
        ClutchServices.ToggleApp()
        setSearch("")
      } catch (e) {
        toast(String(e), {
          type: "error",
          pauseOnFocusLoss: false,
          closeOnClick: true,
        })
      }
    }
  }

  return (
    <li
      ref={ref}
      onKeyDown={e => {
        handleEnter(e)
      }}
      className={cn(
        "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium",
        focused ? "bg-zinc-700" : "text-zinc-300",
      )}
    >
      <div className="flex w-full justify-between text-white">
        <p>{app.name}</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Runs: {app.exec}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </li>
  );
}
