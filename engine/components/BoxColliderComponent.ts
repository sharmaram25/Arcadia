import { Component } from '../Component';

export class BoxColliderComponent extends Component {
  static type = 'BoxCollider';
  width: number;
  height: number;
  tag: string;
  isTrigger: boolean;

  constructor(width: number, height: number, tag: string = 'default', isTrigger: boolean = false) {
    super();
    this.width = width;
    this.height = height;
    this.tag = tag;
    this.isTrigger = isTrigger;
  }
}
