import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { ClutchServices } from "../../../bindings/github.com/vinewz/clutch/app/index";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import type { FormEvent } from "react";

export const Route = createFileRoute("/settings/extensions")({
  component: RouteComponent,
});

function RouteComponent() {
  async function installExtension(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("url") as string;
    if (!url) {
      toast("Please enter a valid URL", {
        type: "error",
        position: "bottom-right",
        autoClose: 2000,
        closeOnClick: true,
      });
      return;
    }

    try {
      const res = await ClutchServices.DownloadExtension(url);
      console.log(res);
    } catch (error) {
      toast("Failed to install extension", {
        type: "error",
        position: "bottom-right",
        autoClose: 2000,
        closeOnClick: true,
      });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Extensions</h1>
      <span className="text-xs text-zinc-400">Install Extension</span>
      <form className="mt-1 flex gap-2" onSubmit={installExtension}>
        <Input placeholder="https://github.com/OWNER/REPO" name="url" />
        <Button>Install</Button>
      </form>
    </div>
  );
}
