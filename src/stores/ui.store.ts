"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * Ephemeral UI state. Lives in memory only — never persisted.
 * Use for: open modals, active palette, hover targets, drag state.
 */
interface UIState {
  paletteOpen: boolean;
  settingsOpen: boolean;
  isEditingLayout: boolean;
  activeDragId: string | null;

  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  openSettings: () => void;
  closeSettings: () => void;

  setEditingLayout: (editing: boolean) => void;
  setActiveDragId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set) => ({
    paletteOpen: false,
    settingsOpen: false,
    isEditingLayout: false,
    activeDragId: null,

    openPalette: () => set({ paletteOpen: true }),
    closePalette: () => set({ paletteOpen: false }),
    togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),

    openSettings: () => set({ settingsOpen: true }),
    closeSettings: () => set({ settingsOpen: false }),

    setEditingLayout: (editing) => set({ isEditingLayout: editing }),
    setActiveDragId: (id) => set({ activeDragId: id }),
  })),
);
