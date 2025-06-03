import type { SectionedListItem } from "./useSectionedlist";
import type { ListRoute } from "./useRoutes";
import type { Quicklink } from "@/routes/settings/quicklinks";
import type { DesktopApp } from "../../bindings/github.com/vinewz/clutch/app";
import { useNavigate } from "@tanstack/react-router";
import {
  type ClutchPkgJson,
  ClutchServices,
} from "../../bindings/github.com/vinewz/clutch/app";
import { Browser } from "@wailsio/runtime";

type UseSelectedListItemProps = {
  action: string
  payload: SectionedListItem
};

export function useActionHandler() {
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

  return function handler({ action, payload }: UseSelectedListItemProps) {
    switch (action) {
      case "app":
        handleApp(payload as DesktopApp);
        break;
      case "extension":
        handleExtensions(payload as ClutchPkgJson);
        break;
      case "route":
        handleRoutes(payload as ListRoute);
        break;
      case "quicklink":
        handleQuicklink(
          payload as Quicklink,
          (payload as Quicklink).command || "",
        );
        break;
      default:
        console.warn("Unknown action:", action);
    }
  };
}
