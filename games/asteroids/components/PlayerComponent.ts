import { Component } from '../../../engine/Component';

export class PlayerComponent extends Component {
  static type = 'Player';
  thrusting: boolean = false;
  cooldown: number = 0;
  invulnerable: number = 0;
}
