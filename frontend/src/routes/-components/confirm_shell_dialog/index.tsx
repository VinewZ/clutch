import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Events } from "@wailsio/runtime";
import { useEffect } from "react";
import { ClutchServices } from "../../../../bindings/github.com/vinewz/clutch/app/";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useLocalStorage } from "@uidotdev/usehooks";

type UseShellDialogProps = {}

type EventMessage = {
  appName: string;
  command?: string;
}

export function ConfirmShellDialog({ }: UseShellDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trustValue, setTrustValue] = useState(false);
  const [eventMsg, setEventMsg] = useState<EventMessage>();
  const [trustedCmds, setTrustedCmds] = useLocalStorage<string[]>("trustedCmds", []);

  function handleConfirmation() {
    if (trustValue && eventMsg) {
      const cmd = `${eventMsg.appName}:${eventMsg.command}`;
      if (!trustedCmds.includes(cmd)) {
        setTrustedCmds([...trustedCmds, cmd]);
      }
    }

    ClutchServices.ConfirmShell(true)
    setIsOpen(false);
    setEventMsg(undefined);
  }

  function handleCancellation() {
    ClutchServices.ConfirmShell(false)
    setIsOpen(false);
    setEventMsg(undefined);
  }

  useEffect(() => {
    Events.On(
      "clutch:require-confirmation",
      (e: { data: EventMessage[] }) => {
        if (trustedCmds.includes(`${e.data[0].appName}:${e.data[0].command}`)) {
          ClutchServices.ConfirmShell(true);
          return;
        }
        const { appName, command } = e.data[0]
        setEventMsg({ appName, command })
        setIsOpen(true)
      }
    )

    return () => {
      Events.Off("clutch:require-confirmation")
    }
  }, [trustedCmds])


  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-2" asChild>
            <div>
              <span>Extension:</span>
              <span className="p-2 rounded border w-full">{eventMsg?.appName}</span>
              <span>Is requesting confirmation to run the following command:</span>
              <span className="p-2 rounded border w-full">
                {eventMsg?.command}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox id="terms"
                  checked={trustValue}
                  onCheckedChange={(checked) => setTrustValue(Boolean(checked))}
                />
                <Label htmlFor="terms">Trust this command.</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>If checked, this extension will not ask for confirmation for this command again.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancellation}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmation}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
