import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
// import { Link, useNavigate} from "@tanstack/react-router";
// import { useEffect } from "react";
// import { useLocation } from "@tanstack/react-router";

export function BackButton() {
  // const navigate = useNavigate();
  // const { pathname } = useLocation();

  // useEffect(() => {
  //   // Only care on extension routes
  //   if (!pathname.includes("/extension/")) {
  //     return;
  //   }

  //   const iframe = document.querySelector(
  //     "#clutch-extension-iframe",
  //   ) as HTMLIFrameElement | null;
  //   if (!iframe?.contentWindow) {
  //     return;
  //   }

  //   const onKeyDown = (e: KeyboardEvent) => {
  //     if (e.altKey && e.key === "ArrowLeft") {
  //       navigate({
  //         from: "/extension/$extension",
  //         to: "/",
  //       });
  //     }
  //   };

  //   // Attach to the iframe's window
  //   const win = iframe.contentWindow;
  //   win.addEventListener("keydown", onKeyDown);

  //   // Cleanup on unmount or if pathname changes
  //   return () => {
  //     win.removeEventListener("keydown", onKeyDown);
  //   };
  // }, [pathname, navigate]);

  return (
    <Link to="/">
      <Button
        className="absolute top-2 left-2 cursor-pointer border border-zinc-600"
        size="sm"
      >
        <ArrowLeft />
      </Button>
    </Link>
  );
}
