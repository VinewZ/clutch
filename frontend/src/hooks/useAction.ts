import type { Quicklink } from "@/routes/settings/quicklinks";
import { useNavigate } from "@tanstack/react-router";
import { Browser } from "@wailsio/runtime";
import { toast } from "react-toastify";
import type {
  ClutchPkgJson,
  DesktopApp,
} from "../../bindings/github.com/vinewz/clutch/app";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app";
import type { ListRoute } from "./useRoutes";
import type { SectionedListItem } from "./useSectionedlist";

type UseSelectedListItemProps = {
  input?: string;
  listItem: SectionedListItem;
};

export function useAction() {
  const navigate = useNavigate();

  function handleApp(app: DesktopApp) {
    try {
      ClutchServices.ExecApp(app);
      ClutchServices.ToggleApp();
    } catch (err) {
      toast.error("An error happened");
      console.error("App launch error: ", err);
    }
  }

  function handleExtensions(extension: ClutchPkgJson) {
    navigate({
      to: "/extension/$extension",
      params: { extension: extension.clutch.repo },
    });
  }

  function handleRoutes(routes: ListRoute) {
    navigate({
      to: routes.path,
    });
  }

  function handleQuicklink(qLink: Quicklink, param: string) {
    try {
      Browser.OpenURL(`${qLink.link}${param}`);
      ClutchServices.ToggleApp();
    } catch (err) {
      toast.error("An error happened");
      console.error("Quicklink launch error: ", err);
    }
  }

  return function handler({ listItem, input }: UseSelectedListItemProps) {
    switch (listItem._section.toLowerCase()) {
      case "apps": {
        const d = listItem as DesktopApp;
        handleApp(d);
        break;
      }
      case "extensions": {
        const e = listItem as ClutchPkgJson;
        handleExtensions(e);
        break;
      }
      case "routes": {
        const l = listItem as ListRoute;
        handleRoutes(l);
        break;
      }
      case "quicklinks": {
        const q = listItem as Quicklink;
        const val = input?.split(" ").slice(1).join(" ");
        if (!val) {
          toast.error("Please provide a parameter for the quicklink");
          return;
        }
        handleQuicklink(q, val);
        break;
      }
      default:
        console.warn("Unknown action:", listItem);
    }
  };
}
