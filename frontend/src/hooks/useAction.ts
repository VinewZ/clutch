import type { SectionedListItem } from "./useSectionedlist";
import type { ListRoute } from "./useRoutes";
import type { Quicklink } from "@/routes/settings/quicklinks";
import type { DesktopApp, ClutchPkgJson } from "../../bindings/github.com/vinewz/clutch/app";
import { useNavigate } from "@tanstack/react-router";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app";
import { Browser } from "@wailsio/runtime";

type UseSelectedListItemProps = {
  action: string
  listItem: SectionedListItem
};

export function useAction() {
  const navigate = useNavigate();

  function handleApp(app: DesktopApp) {
    ClutchServices.ExecApp(app);
    ClutchServices.ToggleApp();
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
    } catch (err) {
      console.log(err);
    }
    ClutchServices.ToggleApp();
  }

  return function handler({ action, listItem }: UseSelectedListItemProps) {
    switch (action) {
      case "apps":
        const d = listItem as DesktopApp
        handleApp(d);
        break;
      case "extensions":
        const e = listItem as ClutchPkgJson
        handleExtensions(e);
        break;
      case "routes":
        const l = listItem as ListRoute
        handleRoutes(l);
        break;
      case "quicklinks":
        const q = listItem as Quicklink
        handleQuicklink(q, q.command || "");
        break;
      default:
        console.warn("Unknown action:", action);
    }
  };
}
