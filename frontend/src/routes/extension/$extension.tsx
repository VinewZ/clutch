import { BackButton } from "@/components/back_button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/extension/$extension")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <BackButton />
      <iframe src="/extensions/launcher/index.html"></iframe>
    </div>
  );
}
