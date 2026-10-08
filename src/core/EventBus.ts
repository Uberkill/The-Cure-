import { EventKey, EventCallback, EventPayloadMap } from '../types';

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventKey, Set<EventCallback<any>>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends EventKey>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const bucket = this.listeners.get(event)!;
    bucket.add(callback);

    return () => {
      bucket.delete(callback);
    };
  }

  public emit<K extends EventKey>(event: K, payload: EventPayloadMap[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;

    for (const callback of bucket) {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for event '${event}':`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
