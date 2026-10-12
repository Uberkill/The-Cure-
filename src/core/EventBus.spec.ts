import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from './EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  it('should be a singleton', () => {
    const instance1 = EventBus.getInstance();
    const instance2 = EventBus.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register and invoke listeners', () => {
    const callback = vi.fn();
    // @ts-ignore - circumventing strict typings for the test
    eventBus.on('ui:view_changed', callback);
    
    // @ts-ignore
    eventBus.emit('ui:view_changed', { view: 'dossier' });
    expect(callback).toHaveBeenCalledWith({ view: 'dossier' });
  });

  it('should not invoke unsubscribed listeners', () => {
    const callback = vi.fn();
    // @ts-ignore
    const unsubscribe = eventBus.on('ui:view_changed', callback);
    
    unsubscribe();
    // @ts-ignore
    eventBus.emit('ui:view_changed', { view: 'dossier' });
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear all listeners', () => {
    const callback = vi.fn();
    // @ts-ignore
    eventBus.on('ui:view_changed', callback);
    
    eventBus.clear();
    // @ts-ignore
    eventBus.emit('ui:view_changed', { view: 'dossier' });
    expect(callback).not.toHaveBeenCalled();
  });
});
