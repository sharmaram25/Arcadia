import { Component } from '../../../engine/Component';

export class LifetimeComponent extends Component {
  static type = 'Lifetime';
  life: number;
  maxLife: number;

  constructor(life: number) {
    super();
    this.life = life;
    this.maxLife = life;
  }
}
