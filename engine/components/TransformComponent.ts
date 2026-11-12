import { Component } from '../Component';

export class TransformComponent extends Component {
  static type = 'Transform';
  x: number;
  y: number;
  rotation: number;
  scale: { x: number; y: number };

  constructor(x: number = 0, y: number = 0, rotation: number = 0, scaleX: number = 1, scaleY: number = 1) {
    super();
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = { x: scaleX, y: scaleY };
  }
}
