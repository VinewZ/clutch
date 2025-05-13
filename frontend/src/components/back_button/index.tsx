import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function BackButton() {
  return (
    <Link to="/">
      <Button
        className="absolute top-3 left-3 cursor-pointer border border-zinc-600"
        size="sm"
      >
        <ArrowLeft />
      </Button>
    </Link>
  );
}
