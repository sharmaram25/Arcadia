import { Component } from '../../../engine/Component';

export class GridPositionComponent extends Component {
  static type = 'GridPosition';
  x: number;
  y: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}
