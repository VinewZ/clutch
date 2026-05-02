export const LaunchType = {
	UserInitiated: "userInitiated" as const,
	Background: "background" as const,
} as const;

export type LaunchType = (typeof LaunchType)[keyof typeof LaunchType];
