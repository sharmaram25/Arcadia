import { Component } from '../Component';

export class VelocityComponent extends Component {
  static type = 'Velocity';
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}
