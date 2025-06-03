import type { SectionedListItem } from "@/hooks/useSectionedlist";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { useActionHandler } from "@/hooks/useActionHandler";

type ItemProps = {
  item: SectionedListItem;
  isFocused: boolean;
  setFocusedId: (id: string) => void;
};

export const ListItem = forwardRef<HTMLLIElement, ItemProps>(
  ({ item, isFocused, setFocusedId }, ref) => {
    const actionHandler = useActionHandler()
    const label = () => {
      switch (true) {
        case item._section === "Apps":
          return item.name;
        case item._section === "Extensions":
          return item.clutch?.name
        case item._section === "Routes":
          return item.label;
        case item._section === "Quicklinks":
          return item.name;
        default:
          return "—";
      }
    }

    const action = () => {
      switch (true) {
        case item._section === "Apps":
          return `app-${item.exec}`
        case item._section === "Extensions":
          return `extension-${item.clutch?.repo}`;
        case item._section === "Routes":
          return `route-${item.label}`;
        case item._section === "Quicklinks":
          return `quicklink-${item.command}`;
        default:
          return "unknown";
      }
    }

    return (
      <li
        ref={ref}
        id={item._uid}
        data-action={action()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const action = e.currentTarget.dataset.action?.split("-")[0];
          actionHandler({
            action: action || "unknown",
            payload: item,
          });
        }}
        onMouseEnter={() => setFocusedId(item._uid)}
        onMouseLeave={() => setFocusedId("")}
        className={cn(
          "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded p-2 text-sm",
          isFocused ? "bg-zinc-700" : "text-zinc-300",
        )}
      >
        <div className="flex items-center gap-1">
          {item._section === "Quicklinks" && <img className="size-4" src={item.icon} />}
          {item._section === "Quicklinks" && <span>{item.command} – </span>}
          <span>{label()}</span>
        </div>
        {item._section === "Apps" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={16} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Runs: {item.exec}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </li>
    );
  },
);
