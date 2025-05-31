import { BackButton } from "@/components/back_button";
import { useTheme } from "@/providers/theme";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/extension/$extension")({
  component: RouteComponent,
});

function RouteComponent() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const params = Route.useParams();
  const { theme } = useTheme();

  function handleExtensionReady(e: MessageEvent) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "theme", theme },
      e.origin,
    );
  }

  function handleExtensionNavigate(e: MessageEvent) {
    navigate({
      from: "/extension/$extension",
      to: e.data?.path,
    });
  }

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      switch (e.data?.type) {
        case "clutch-extension-ready":
          handleExtensionReady(e);
          break;
        case "clutch-extension-navigate":
          handleExtensionNavigate(e);
          break;
      }
    };

    const focusIframe = () => {
      iframeRef.current?.focus();
    };

    window.addEventListener("message", handleMessage);
    iframeRef.current?.addEventListener("load", focusIframe);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("load", focusIframe);
    };
  }, [theme, handleExtensionReady, handleExtensionNavigate]);

  return (
    <div>
      <BackButton />
      <iframe
        title={params.extension}
        ref={iframeRef}
        className="h-dvh w-dvw bg-transparent"
        src={`/extensions/${params.extension}/dist/index.html`}
      />
    </div>
  );
}
