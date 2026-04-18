import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StoreService } from "bindings/github.com/vinewz/clutch/internal/store";
import type {
	Extension,
	InstalledExt,
} from "bindings/github.com/vinewz/clutch/internal/store/models";

export function useExtensions() {
	return useQuery({
		queryKey: ["extensions"],
		queryFn: () => StoreService.GetExtensions(),
		staleTime: 5 * 60 * 1000,
	});
}

export function useSearchExtensions(query: string) {
	return useQuery({
		queryKey: ["extensions", "search", query],
		queryFn: () => StoreService.SearchExtensions(query),
		staleTime: 5 * 60 * 1000,
		enabled: query.length > 0,
	});
}

export function useInstalledExtensions() {
	return useQuery({
		queryKey: ["extensions", "installed"],
		queryFn: () => StoreService.GetInstalledExtensions(),
	});
}

export type ExtensionCommandItem = {
	extName: string;
	extTitle: string;
	extIcons: { light: string; dark: string };
	command: { name: string; title: string; description: string; mode: string };
};

export function useExtensionCommands(): ExtensionCommandItem[] {
	const { data: installed = [] } = useInstalledExtensions();
	const items: ExtensionCommandItem[] = [];
	for (const ext of installed) {
		for (const cmd of ext.commands) {
			items.push({
				extName: ext.name,
				extTitle: ext.title,
				extIcons: {
					light: ext.icons?.light ?? "",
					dark: ext.icons?.dark ?? "",
				},
				command: {
					name: cmd.name,
					title: cmd.title,
					description: cmd.description,
					mode: cmd.mode,
				},
			});
		}
	}
	return items;
}

export function useInstallExtension() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => StoreService.InstallExtension(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["extensions"] });
		},
	});
}

export function useUninstallExtension() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => StoreService.UninstallExtension(name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["extensions"] });
		},
	});
}

export type { Extension, InstalledExt };
