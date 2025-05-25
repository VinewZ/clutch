import { useQuery } from "@tanstack/react-query";
import { ClutchPkgJson, ClutchServices } from "../../bindings/github.com/vinewz/clutch/app/index";

async function getExtensions(): Promise<ClutchPkgJson[]> {
  try {
    const extensionsJson = await ClutchServices.GetExtensions();
    return extensionsJson
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function useDesktopExtensions() {
  return useQuery<ClutchPkgJson[]>({
    queryKey: ["clutch-extensions"],
    queryFn: getExtensions,
  });
}
