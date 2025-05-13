import { Check, FolderCode } from "lucide-react";
import { Dialogs } from "@wailsio/runtime";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SelectDevExtension() {
  const [extensionPath, setExtensionPath] = useState("");
  const isJson = extensionPath.includes("package.json");

  useEffect(() => {
    if (extensionPath) {
    }
  }, [extensionPath]);

  return (
    <div>
      <div className="mb-5 w-full">
        <Button
          variant="ghost"
          className={`flex h-fit w-full cursor-pointer flex-col items-center justify-center gap-0 rounded-2xl border border-dashed border-gray-300 bg-zinc-800 py-9 transition-colors hover:bg-zinc-700`}
          onClick={async () => {
            const res = await Dialogs.OpenFile({
              AllowsMultipleSelection: false,
            });
            setExtensionPath(res);
          }}
        >
          <div className="mb-3 flex items-center justify-center">
            {extensionPath ? (
              <Check className="size-12" />
            ) : (
              <FolderCode className="size-12" />
            )}
          </div>
          <span className="mb-1 text-center text-xs leading-4 font-normal text-zinc-400">
            Click to open
          </span>
          {extensionPath ? (
            <div>
              <span>Selected:</span>
              {isJson ? (
                <div className="flex flex-col">
                  <span>HMR Enabled</span>
                  <span>{extensionPath}</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span>STATIC Enabled</span>
                  <span>{extensionPath}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-center text-sm leading-snug font-medium text-zinc-400">
                Selected a{" "}
                <span className="font-bold italic">package.json</span> for{" "}
                <span className="font-bold italic">HMR</span>
              </span>
              <span className="text-center text-sm leading-snug font-medium text-zinc-400">
                Selected an <span className="font-bold italic">index.html</span>{" "}
                for <span className="font-bold italic">STATIC</span>
              </span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
