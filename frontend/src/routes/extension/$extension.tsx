import { BackButton } from "@/components/back_button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/extension/$extension")({
  component: RouteComponent,
});

function RouteComponent() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const params = Route.useParams();

  useEffect(() => {

    const focusIframe = () => {
      iframeRef.current?.focus();
    };

    iframeRef.current?.addEventListener("load", focusIframe);
    return () => {
      window.removeEventListener("load", focusIframe);
    };
  }, []);

  return (
    <div>
      <BackButton />
      <iframe
        ref={iframeRef}
        className="h-dvh w-dvw bg-transparent"
        src={`/extensions/${params.extension}/dist/index.html`}
      />
    </div>
  );
}
