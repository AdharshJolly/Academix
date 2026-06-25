/**
 * AppProvider
 * Root provider wrapping all context providers.
 * Must be applied at the layout level.
 * TODO: Compose AuthProvider + DashboardProvider + ThemeProvider
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
    // TODO: Wrap with all providers
    return <>{children}</>;
}

