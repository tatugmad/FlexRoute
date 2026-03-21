import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { Label } from "@/types";

const STORAGE_KEY = "flexroute:labels";

function readAll(): Label[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Label[];
  } catch (err) {
    fr.error(C.LABEL_STORAGE, "labelStorage.parseFailed", { err });
    return [];
  }
}

function writeAll(labels: Label[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
}

export const labelStorageService = {
  getLabels: (): Label[] => {
    const labels = readAll();
    fr.debug(C.LABEL_STORAGE, "labelStorage.loaded", { count: labels.length });
    return labels;
  },

  saveLabel: (label: Label): void => {
    const labels = readAll();
    const index = labels.findIndex((l) => l.id === label.id);
    if (index >= 0) {
      labels[index] = label;
    } else {
      labels.push(label);
    }
    writeAll(labels);
    fr.info(C.LABEL_STORAGE, "labelStorage.saved", { id: label.id, name: label.name });
  },

  deleteLabel: (labelId: string): void => {
    const labels = readAll().filter((l) => l.id !== labelId);
    writeAll(labels);
    fr.info(C.LABEL_STORAGE, "labelStorage.deleted", { id: labelId });
  },

  getLabel: (labelId: string): Label | undefined => {
    return readAll().find((l) => l.id === labelId);
  },
};
