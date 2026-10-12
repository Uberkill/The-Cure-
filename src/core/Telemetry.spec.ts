// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Telemetry } from './Telemetry';
import { EventBus } from './EventBus';

describe('Telemetry', () => {
  let telemetry: Telemetry;
  let eventBus: EventBus;
  let originalConsoleError: any;
  let originalConsoleWarn: any;
  let originalConsoleLog: any;

  beforeEach(() => {
    telemetry = Telemetry.getInstance();
    eventBus = EventBus.getInstance();
    eventBus.clear();
    
    // @ts-ignore
    telemetry.buffer = [];

    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    
    console.error = vi.fn();
    console.warn = vi.fn();
    console.log = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should be a singleton', () => {
    const instance1 = Telemetry.getInstance();
    const instance2 = Telemetry.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should record an info message and log to console', () => {
    const spy = vi.fn();
    // @ts-ignore
    eventBus.on('telemetry:log', spy);

    telemetry.record('info', 'Test info message');
    
    expect(console.log).toHaveBeenCalledWith('[Telemetry INFO] Test info message');
    const history = telemetry.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].message).toBe('Test info message');
    expect(spy).toHaveBeenCalled();
  });

  it('should respect the max entries limit (100)', () => {
    for (let i = 0; i < 105; i++) {
      telemetry.record('info', `Message ${i}`);
    }
    const history = telemetry.getHistory();
    expect(history.length).toBe(100);
    expect(history[0].message).toBe('Message 5');
    expect(history[99].message).toBe('Message 104');
  });
});
