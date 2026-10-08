import { EventBus } from './EventBus';
import { TelemetryRecord } from '../types';

export class Telemetry {
  private static instance: Telemetry;
  private buffer: TelemetryRecord[] = [];
  private readonly maxEntries = 100;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.initGlobalHandlers();
  }

  public static getInstance(): Telemetry {
    if (!Telemetry.instance) {
      Telemetry.instance = new Telemetry();
    }
    return Telemetry.instance;
  }

  private initGlobalHandlers(): void {
    window.addEventListener('error', (event: ErrorEvent) => {
      this.record('error', `Uncaught exception: ${event.message}`, event.filename);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.record('error', `Unhandled Promise rejection: ${String(event.reason)}`);
    });
  }

  public record(level: 'info' | 'warn' | 'error', message: string, context?: string): void {
    const record: TelemetryRecord = {
      timestamp: Date.now(),
      level,
      message,
      context
    };

    if (this.buffer.length >= this.maxEntries) {
      this.buffer.shift();
    }
    this.buffer.push(record);

    if (level === 'error') {
      console.error(`[Telemetry ERROR] ${message} (${context || 'no context'})`);
    } else if (level === 'warn') {
      console.warn(`[Telemetry WARN] ${message}`);
    } else {
      console.log(`[Telemetry INFO] ${message}`);
    }

    this.eventBus.emit('telemetry:log', record);
  }

  public getHistory(): readonly TelemetryRecord[] {
    return this.buffer;
  }
}
