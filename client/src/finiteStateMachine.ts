import { State, StateInterface } from "./playerState.js";

export class FiniteStateMachine {

  _states:any;
  _currentState:any;

  constructor() {
    this._states = {}
    this._currentState = null
  }

  _AddState(name:string, type: typeof State) {
    this._states[name] = type
  }

  SetState(name:string) {
    const prevState = this._currentState

    if (prevState) {
      if (prevState.Name == name) {
        return
      }
      prevState.Exit()
    }

    const state = new this._states[name](this)

    this._currentState = state
    state.Enter(prevState)
  }

  Update(timeElapsed:number, input:any) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input)
    }
  }
}
