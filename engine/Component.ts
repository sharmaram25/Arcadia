export abstract class Component {
  static type: string;
  
  constructor() {}
}

export interface ComponentConstructor<T extends Component> {
  new (...args: any[]): T;
  type: string;
}
