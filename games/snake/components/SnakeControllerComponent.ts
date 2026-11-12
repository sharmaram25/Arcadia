import { Component } from '../../../engine/Component';

export class SnakeControllerComponent extends Component {
  static type = 'SnakeController';
  bodyIds: string[] = [];
  
  constructor(bodyIds: string[] = []) {
    super();
    this.bodyIds = bodyIds;
  }
}
