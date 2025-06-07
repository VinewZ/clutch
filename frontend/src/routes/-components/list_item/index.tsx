import type { SectionedListItem } from "@/hooks/useSectionedlist";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type ItemProps = {
  item: SectionedListItem;
};

export function ListItem({ item }: ItemProps) {
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

  return (
    <>
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

    </>
  )
}

