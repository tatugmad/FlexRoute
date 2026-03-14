import { create } from "zustand";
import { labelStorageService } from "@/services/labelStorage";
import { generateId } from "@/utils/generateId";
import { logService } from "@/services/logService";
import type { PlaceLabel } from "@/types";

type LabelState = {
  labels: PlaceLabel[];
  editingLabel: PlaceLabel | null;
  isLabelModalOpen: boolean;
};

type LabelActions = {
  loadLabels: () => void;
  addLabel: (name: string, color: string) => void;
  updateLabel: (id: string, updates: { name?: string; color?: string }) => void;
  deleteLabel: (id: string) => void;
  openLabelModal: (label?: PlaceLabel) => void;
  closeLabelModal: () => void;
};

export const useLabelStore = create<LabelState & LabelActions>()((set) => ({
  labels: [],
  editingLabel: null,
  isLabelModalOpen: false,

  loadLabels: () => {
    const labels = labelStorageService.getLabels();
    set({ labels });
  },

  addLabel: (name, color) => {
    const now = new Date().toISOString();
    const label: PlaceLabel = {
      id: generateId(),
      name,
      color,
      createdAt: now,
      updatedAt: now,
    };
    labelStorageService.saveLabel(label);
    logService.info("LABEL_STORE", "ラベル追加", { id: label.id, name });
    set((state) => ({ labels: [...state.labels, label] }));
  },

  updateLabel: (id, updates) => {
    set((state) => {
      const target = state.labels.find((l) => l.id === id);
      if (!target) return state;
      const updated: PlaceLabel = {
        ...target,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      labelStorageService.saveLabel(updated);
      logService.info("LABEL_STORE", "ラベル更新", { id, updates });
      return { labels: state.labels.map((l) => (l.id === id ? updated : l)) };
    });
  },

  deleteLabel: (id) => {
    labelStorageService.deleteLabel(id);
    logService.info("LABEL_STORE", "ラベル削除", { id });
    set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }));
  },

  openLabelModal: (label) => {
    set({ isLabelModalOpen: true, editingLabel: label ?? null });
  },

  closeLabelModal: () => {
    set({ isLabelModalOpen: false, editingLabel: null });
  },
}));
