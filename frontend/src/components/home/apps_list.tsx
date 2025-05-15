import { ClutchServices } from "../../../bindings/github.com/vinewz/clutch/app/index";
import type { DesktopApp } from "../../../bindings/github.com/vinewz/clutch/app/models";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useKeyboardListNavigation } from "@/hooks/useKeyboardNavigationList";
import { useEffect } from "react";
import { toast } from "react-toastify";

type AppsListProps = {
  apps: DesktopApp[];
};

export function AppsList({ apps }: AppsListProps) {
  const { index, selected } = useKeyboardListNavigation({
    list: apps,
    onEnter: async () => {
      try {
        await ClutchServices.ExecApp(selected);
      } catch (error) {
        toast(String(error), {
          type: "error",
          position: "bottom-right",
          autoClose: 5000,
        });
      }
    },
    bindAxis: "vertical",
  });

  useEffect(() => {
    const selectedItem = document.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [index]);

  return (
    <ul className="overflow-y-auto py-2">
      {apps.map((app, idx) => (
        <li
          key={app.Id}
          className={cn(
            "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium text-zinc-300",
            index === idx && "bg-zinc-700",
          )}
          data-index={idx}
        >
          <div className="flex w-full justify-between">
            <p>{app.Name}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Run: {app.Exec}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </li>
      ))}
    </ul>
  );
}
