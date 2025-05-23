import { ClutchServices, DesktopApp } from "../../../bindings/github.com/vinewz/clutch/app/index";
import { useRef, type KeyboardEvent } from "react";
import { useFocusEffect, useRovingTabIndex } from "react-roving-tabindex";
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
  app: DesktopApp
  disabled?: boolean;
};

export function FocusableLi({
  app,
  disabled = false,
}: FocusableLiProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(
    // @ts-ignore
    ref,
    disabled,
  );
  // @ts-ignore
  useFocusEffect(focused, ref);


  function handleEnter(e: KeyboardEvent<HTMLLIElement>) {
    e.preventDefault()
    if (e.key.toLowerCase() == "enter") {
      try {
        ClutchServices.ExecApp(app)
        ClutchServices.ToggleApp()
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
      tabIndex={tabIndex}
      onKeyDown={e => {
        handleKeyDown(e)
        handleEnter(e)
      }}
      onClick={handleClick}
      className={cn(
        "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium",
        focused ? "bg-zinc-700" : "text-zinc-300",
      )}
      role="option" // optional ARIA role
      aria-disabled={disabled} // reflect disabled state
    >
      <div className="flex w-full justify-between text-white">
        <p>{app.name}</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Run: {app.exec}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </li>
  );
}
