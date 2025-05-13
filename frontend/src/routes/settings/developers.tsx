import { SelectDevExtension } from "@/components/settings/drag_and_drop";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/developers")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <span>Add Dev Extension</span>
        <SelectDevExtension />
      </div>
    </div>
  );
}
