import React, { createContext, useContext, useState } from 'react';

type TabBarVisibilityContextValue = {
  tabBarVisible: boolean;
  setTabBarVisible: (v: boolean) => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  return (
    <TabBarVisibilityContext.Provider value={{ tabBarVisible, setTabBarVisible }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityContext);
  return ctx ?? { tabBarVisible: true, setTabBarVisible: () => {} };
}
