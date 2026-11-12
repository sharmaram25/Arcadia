import { Component, ComponentConstructor } from './Component';

export class Entity {
  id: string;
  components: Map<string, Component>;
  isMarkedForRemoval: boolean = false;

  constructor(id: string) {
    this.id = id;
    this.components = new Map();
  }

  addComponent<T extends Component>(component: T): Entity {
    const type = (component.constructor as any).type;
    if (!type) {
      throw new Error(`Component ${component.constructor.name} does not have a static type property.`);
    }
    this.components.set(type, component);
    return this;
  }

  getComponent<T extends Component>(componentClass: ComponentConstructor<T>): T | undefined {
    return this.components.get(componentClass.type) as T;
  }

  hasComponent<T extends Component>(componentClass: ComponentConstructor<T>): boolean {
    return this.components.has(componentClass.type);
  }

  removeComponent<T extends Component>(componentClass: ComponentConstructor<T>): void {
    this.components.delete(componentClass.type);
  }
}
