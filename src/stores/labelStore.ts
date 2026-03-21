import { create } from "zustand";
import { labelStorageService } from "@/services/labelStorage";
import { generateId } from "@/utils/generateId";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { Label } from "@/types";

type LabelState = {
  labels: Label[];
  editingLabel: Label | null;
  isLabelModalOpen: boolean;
};

type LabelActions = {
  loadLabels: () => void;
  addLabel: (name: string, color: string, forRoute: boolean, forPlace: boolean) => void;
  updateLabel: (id: string, updates: { name?: string; color?: string; forRoute?: boolean; forPlace?: boolean }) => void;
  deleteLabel: (id: string) => void;
  openLabelModal: (label?: Label) => void;
  closeLabelModal: () => void;
};

export const useLabelStore = create<LabelState & LabelActions>()((set) => ({
  labels: [],
  editingLabel: null,
  isLabelModalOpen: false,

  loadLabels: () => {
    const raw = labelStorageService.getLabels();
    const labels = raw.map((l) => ({
      ...l,
      forRoute: l.forRoute ?? true,
      forPlace: l.forPlace ?? true,
    }));
    set({ labels });
  },

  addLabel: (name, color, forRoute, forPlace) => {
    const now = new Date().toISOString();
    const label: Label = {
      id: generateId(),
      name,
      color,
      forRoute,
      forPlace,
      createdAt: now,
      updatedAt: now,
    };
    labelStorageService.saveLabel(label);
    set((state) => ({ labels: [...state.labels, label] }));
  },

  updateLabel: (id, updates) => {
    set((state) => {
      const target = state.labels.find((l) => l.id === id);
      if (!target) return state;
      const updated: Label = {
        ...target,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      labelStorageService.saveLabel(updated);
      fr.info(C.LABEL_STORE, "label.updated", { id, updates });
      return { labels: state.labels.map((l) => (l.id === id ? updated : l)) };
    });
  },

  deleteLabel: (id) => {
    labelStorageService.deleteLabel(id);
    set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }));
  },

  openLabelModal: (label) => {
    set({ isLabelModalOpen: true, editingLabel: label ?? null });
  },

  closeLabelModal: () => {
    set({ isLabelModalOpen: false, editingLabel: null });
  },
}));
