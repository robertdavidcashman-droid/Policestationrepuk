'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const HINT_SESSION_KEY = 'psruk-ai-hint-dismissed';

type PanelTab = 'ask' | 'contact';

type AssistantUiContextValue = {
  open: boolean;
  tab: PanelTab;
  showHint: boolean;
  setOpen: (open: boolean) => void;
  setTab: (tab: PanelTab) => void;
  openAssistant: () => void;
  dismissHint: () => void;
};

const AssistantUiContext = createContext<AssistantUiContextValue | null>(null);

export function AssistantUiProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [tab, setTab] = useState<PanelTab>('ask');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      setShowHint(sessionStorage.getItem(HINT_SESSION_KEY) !== '1');
    } catch {
      setShowHint(false);
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      sessionStorage.setItem(HINT_SESSION_KEY, '1');
    } catch {
      /* private browsing */
    }
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (next) {
        dismissHint();
        setTab('ask');
      }
    },
    [dismissHint],
  );

  const openAssistant = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const value = useMemo(
    () => ({ open, tab, showHint, setOpen, setTab, openAssistant, dismissHint }),
    [open, tab, showHint, setOpen, openAssistant, dismissHint],
  );

  return <AssistantUiContext.Provider value={value}>{children}</AssistantUiContext.Provider>;
}

export function useAssistantUi(): AssistantUiContextValue {
  const ctx = useContext(AssistantUiContext);
  if (!ctx) {
    throw new Error('useAssistantUi must be used within AssistantUiProvider');
  }
  return ctx;
}

/** Safe hook for optional surfaces (returns no-op open if provider missing). */
export function useAssistantUiOptional(): AssistantUiContextValue | null {
  return useContext(AssistantUiContext);
}
