"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeKey = "midnight" | "ocean" | "emerald" | "sunset" | "rose" | "light";

interface ThemeColors {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    bgCard: string;
    sidebarBg: string;
    dot: string;
    isDark: boolean;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBg: string;
    cardBorder: string;
    hoverBg: string;
    topBarBg: string;
}

const themes: Record<ThemeKey, ThemeColors> = {
    midnight: {
        name: "Midnight",
        primary: "#8b5cf6",
        secondary: "#3b82f6",
        accent: "#f472b6",
        bg: "#0a0e1a",
        bgCard: "rgba(255,255,255,0.03)",
        sidebarBg: "rgba(0,0,0,0.3)",
        dot: "#8b5cf6",
        isDark: true,
        textPrimary: "#ffffff",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255,255,255,0.06)",
        inputBg: "rgba(0,0,0,0.3)",
        cardBorder: "rgba(255,255,255,0.06)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(0,0,0,0.2)",
    },
    ocean: {
        name: "Ocean",
        primary: "#06b6d4",
        secondary: "#0ea5e9",
        accent: "#22d3ee",
        bg: "#030c1a",
        bgCard: "rgba(6,182,212,0.04)",
        sidebarBg: "rgba(3,12,26,0.6)",
        dot: "#06b6d4",
        isDark: true,
        textPrimary: "#ffffff",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255,255,255,0.06)",
        inputBg: "rgba(0,0,0,0.3)",
        cardBorder: "rgba(255,255,255,0.06)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(0,0,0,0.2)",
    },
    emerald: {
        name: "Emerald",
        primary: "#10b981",
        secondary: "#34d399",
        accent: "#6ee7b7",
        bg: "#040d09",
        bgCard: "rgba(16,185,129,0.04)",
        sidebarBg: "rgba(4,13,9,0.6)",
        dot: "#10b981",
        isDark: true,
        textPrimary: "#ffffff",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255,255,255,0.06)",
        inputBg: "rgba(0,0,0,0.3)",
        cardBorder: "rgba(255,255,255,0.06)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(0,0,0,0.2)",
    },
    sunset: {
        name: "Sunset",
        primary: "#f59e0b",
        secondary: "#f97316",
        accent: "#fbbf24",
        bg: "#0d0805",
        bgCard: "rgba(245,158,11,0.04)",
        sidebarBg: "rgba(13,8,5,0.6)",
        dot: "#f59e0b",
        isDark: true,
        textPrimary: "#ffffff",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255,255,255,0.06)",
        inputBg: "rgba(0,0,0,0.3)",
        cardBorder: "rgba(255,255,255,0.06)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(0,0,0,0.2)",
    },
    rose: {
        name: "Rose",
        primary: "#f43f5e",
        secondary: "#e11d48",
        accent: "#fb7185",
        bg: "#0d0508",
        bgCard: "rgba(244,63,94,0.04)",
        sidebarBg: "rgba(13,5,8,0.6)",
        dot: "#f43f5e",
        isDark: true,
        textPrimary: "#ffffff",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255,255,255,0.06)",
        inputBg: "rgba(0,0,0,0.3)",
        cardBorder: "rgba(255,255,255,0.06)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(0,0,0,0.2)",
    },
    light: {
        name: "Light",
        primary: "#7c3aed",
        secondary: "#2563eb",
        accent: "#ec4899",
        bg: "#f8fafc",
        bgCard: "#ffffff",
        sidebarBg: "#ffffff",
        dot: "#7c3aed",
        isDark: false,
        textPrimary: "#0f172a",
        textSecondary: "#64748b",
        textMuted: "#94a3b8",
        border: "rgba(0,0,0,0.08)",
        inputBg: "#f1f5f9",
        cardBorder: "rgba(0,0,0,0.08)",
        hoverBg: "rgba(0,0,0,0.03)",
        topBarBg: "rgba(255,255,255,0.8)",
    },
};

interface ThemeContextType {
    theme: ThemeKey;
    t: ThemeColors;
    setTheme: (t: ThemeKey) => void;
    allThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "midnight",
    t: themes.midnight,
    setTheme: () => { },
    allThemes: themes,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeKey>("midnight");

    useEffect(() => {
        const saved = localStorage.getItem("admin-theme") as ThemeKey | null;
        if (saved && themes[saved]) setThemeState(saved);
    }, []);

    const setTheme = (key: ThemeKey) => {
        setThemeState(key);
        localStorage.setItem("admin-theme", key);
        const c = themes[key];
        document.documentElement.style.setProperty("--primary", c.primary);
        document.documentElement.style.setProperty("--secondary", c.secondary);
        document.documentElement.style.setProperty("--accent", c.accent);
    };

    useEffect(() => {
        const c = themes[theme];
        document.documentElement.style.setProperty("--primary", c.primary);
        document.documentElement.style.setProperty("--secondary", c.secondary);
        document.documentElement.style.setProperty("--accent", c.accent);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, t: themes[theme], setTheme, allThemes: themes }}>
            {children}
        </ThemeContext.Provider>
    );
}
