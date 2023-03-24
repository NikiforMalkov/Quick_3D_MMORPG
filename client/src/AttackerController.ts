import { Component } from "./entity.js"

export  class AttackController extends Component {

  action_: any;
  
  constructor() {
    super()
    this.action_ = null
  }

  InitComponent() {
    this._RegisterHandler('player.action', (m:any) => {
      this._OnAnimAction(m)
    })
  }

  _OnAnimAction(m:any) {
    if (m.action != 'attack') {
      this.action_ = m.action
      return
    } else if (m.action != this.action_) {
      this.action_ = m.action
      this.Broadcast({
        topic: 'action.attack'
      })
    }
  }
}

