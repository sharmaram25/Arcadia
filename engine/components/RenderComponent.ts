import { Component } from '../Component';

export class RenderComponent extends Component {
  static type = 'Render';
  color: string;
  shape: 'rectangle' | 'circle';
  width: number;
  height: number;
  zIndex: number;

  constructor(color: string, shape: 'rectangle' | 'circle' = 'rectangle', width: number = 0, height: number = 0, zIndex: number = 0) {
    super();
    this.color = color;
    this.shape = shape;
    this.width = width;
    this.height = height;
    this.zIndex = zIndex;
  }
}
