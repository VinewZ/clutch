import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function BackButton() {
  const navigate = useNavigate()

  function handleKeyDown(e: KeyboardEvent) {
    if (e.altKey && e.key === "ArrowLeft") {
      navigate({
        to: "/"
      })
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", e => handleKeyDown(e))
    return () => window.addEventListener("keydown", e => handleKeyDown(e))
  }, [])

  return (
    <Link to="/">
      <Button
        className="fixed top-2 left-2 cursor-pointer border border-zinc-600 z-[999]"
        size="sm"
      >
        <ArrowLeft />
      </Button>
    </Link>
  );
}
