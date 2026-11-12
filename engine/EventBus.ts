type EventHandler = (payload?: any) => void;

export class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) return;
    const handlers = this.listeners.get(event)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, payload?: any): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(handler => handler(payload));
  }
  
  clear(): void {
    this.listeners.clear();
  }
}
