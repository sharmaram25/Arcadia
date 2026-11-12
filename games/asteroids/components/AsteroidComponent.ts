import { Component } from '../../../engine/Component';

export class AsteroidComponent extends Component {
  static type = 'Asteroid';
  size: number;
  vertices: { x: number; y: number }[];
  rotationSpeed: number;

  constructor(size: number, vertices: { x: number; y: number }[], rotationSpeed: number) {
    super();
    this.size = size;
    this.vertices = vertices;
    this.rotationSpeed = rotationSpeed;
  }
}
