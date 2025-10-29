/**
 * Background sync queue - allows mutations to complete instantly
 * while syncing to the server asynchronously in the background
 */

export interface SyncTask {
  id: string;
  type: string;
  priority: number;
  execute: () => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

class BackgroundSyncQueue {
  private queue: SyncTask[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private activeCount = 0;

  /**
   * Add a task to the background sync queue.
   * Tasks are processed in the background without blocking the UI.
   */
  enqueue(task: SyncTask) {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      this.activeCount++;
      this.executeTask(task);
    }

    this.processing = false;
  }

  private async executeTask(task: SyncTask) {
    try {
      await task.execute();
      task.onSuccess?.();
    } catch (error) {
      console.error(`Sync task failed: ${task.type}`, error);
      task.onError?.(error instanceof Error ? error : new Error(String(error)));
      // Optionally add to retry queue or show error toast
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queued: this.queue.length,
      processing: this.activeCount,
    };
  }

  /**
   * Clear the queue (useful for testing or cleanup)
   */
  clear() {
    this.queue = [];
  }
}

export const syncQueue = new BackgroundSyncQueue();

/**
 * Helper to create a sync task that doesn't block the UI
 */
export function createSyncTask(
  type: string,
  execute: () => Promise<void>,
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  priority = 0,
) {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    priority,
    execute,
    onError,
    onSuccess,
  };
}
