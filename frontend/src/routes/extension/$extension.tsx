import { BackButton } from "@/components/back_button";
import { useTheme } from "@/providers/theme";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/extension/$extension")({
  component: RouteComponent,
});

function RouteComponent() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const params = Route.useParams();
  const { theme } = useTheme();

  useEffect(() => {
    const handleParentMessage = (e: MessageEvent) => {
      if (e.data?.type === "clutch-extension-ready") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "theme", theme },
          e.origin,
        );
      }
    };

    window.addEventListener("message", handleParentMessage);
    return () => window.removeEventListener("message", handleParentMessage);
  }, [theme]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "theme", theme },
      "*",
    );
  }, [theme]);

  return (
    <div>
      <BackButton />
      <iframe
        id="clutch-extension-iframe"
        ref={iframeRef}
        className="h-dvh w-dvw bg-transparent"
        src={`${params.extension}`}
      ></iframe>
    </div>
  );
}
