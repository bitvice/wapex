import { createContext, useContext, useState, useCallback } from "react";

export type SidebarPosition = "left" | "right";

interface SettingsContextType {
  sidebarPosition: SidebarPosition;
  setSidebarPosition: (pos: SidebarPosition) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  sidebarPosition: "left",
  setSidebarPosition: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
    return (localStorage.getItem("wapex-sidebar-position") as SidebarPosition) || "left";
  });

  const setSidebarPosition = useCallback((pos: SidebarPosition) => {
    setSidebarPositionState(pos);
    localStorage.setItem("wapex-sidebar-position", pos);
  }, []);

  return (
    <SettingsContext.Provider value={{ sidebarPosition, setSidebarPosition }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
