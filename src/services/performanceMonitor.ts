import type { PerformanceMetric } from "@/types";
import { logService } from "./logService";

const SLOW_THRESHOLD_MS = 5000;

type TimerEntry = {
  start: number;
};

type MetricAccumulator = {
  count: number;
  total: number;
  min: number;
  max: number;
};

class PerformanceMonitorImpl {
  private timers = new Map<string, TimerEntry>();
  private metrics = new Map<string, MetricAccumulator>();

  startTimer(label: string): void {
    this.timers.set(label, { start: performance.now() });
  }

  endTimer(label: string): number {
    const timer = this.timers.get(label);
    if (!timer) {
      logService.warn("PERF", `Timer not found: ${label}`);
      return 0;
    }

    const elapsed = performance.now() - timer.start;
    this.timers.delete(label);
    this.recordMetric(label, elapsed);

    if (elapsed >= SLOW_THRESHOLD_MS) {
      logService.warn("PERF", `Slow operation: ${label}`, {
        elapsed: Math.round(elapsed),
      });
    } else {
      logService.info("PERF", `${label}`, {
        elapsed: Math.round(elapsed),
      });
    }

    return elapsed;
  }

  getMetrics(): Record<string, PerformanceMetric> {
    const result: Record<string, PerformanceMetric> = {};
    for (const [label, acc] of this.metrics) {
      result[label] = {
        count: acc.count,
        avg: Math.round(acc.total / acc.count),
        min: Math.round(acc.min),
        max: Math.round(acc.max),
      };
    }
    return result;
  }

  private recordMetric(label: string, elapsed: number): void {
    const existing = this.metrics.get(label);
    if (existing) {
      existing.count += 1;
      existing.total += elapsed;
      existing.min = Math.min(existing.min, elapsed);
      existing.max = Math.max(existing.max, elapsed);
    } else {
      this.metrics.set(label, {
        count: 1,
        total: elapsed,
        min: elapsed,
        max: elapsed,
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitorImpl();
