import { logService } from "@/services/logService";
import type { PlaceLabel } from "@/types";

const STORAGE_KEY = "flexroute:labels";

function readAll(): PlaceLabel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlaceLabel[];
  } catch {
    return [];
  }
}

function writeAll(labels: PlaceLabel[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
}

export const labelStorageService = {
  getLabels: (): PlaceLabel[] => {
    const labels = readAll();
    logService.info("LABEL_STORAGE", "ラベル一覧読み込み", { count: labels.length });
    return labels;
  },

  saveLabel: (label: PlaceLabel): void => {
    const labels = readAll();
    const index = labels.findIndex((l) => l.id === label.id);
    if (index >= 0) {
      labels[index] = label;
    } else {
      labels.push(label);
    }
    writeAll(labels);
    logService.info("LABEL_STORAGE", "ラベル保存", { id: label.id, name: label.name });
  },

  deleteLabel: (labelId: string): void => {
    const labels = readAll().filter((l) => l.id !== labelId);
    writeAll(labels);
    logService.info("LABEL_STORAGE", "ラベル削除", { id: labelId });
  },

  getLabel: (labelId: string): PlaceLabel | undefined => {
    return readAll().find((l) => l.id === labelId);
  },
};
