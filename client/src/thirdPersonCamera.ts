import { PerspectiveCamera, Vector3 } from "three"
import { Component } from "./entity.js"

export class ThirdPersonCamera extends Component {

  _currentPosition:Vector3
  _currentLookat:Vector3
  _params:any;
  _camera:PerspectiveCamera;

  constructor(params:any) {
    super()

    this._params = params
    this._camera = params.camera

    this._currentPosition = new Vector3()
    this._currentLookat = new Vector3()
  }

  _CalculateIdealOffset() {
    const idealOffset = new Vector3(-0, 10, -15)
    idealOffset.applyQuaternion(this._params.target._rotation)
    idealOffset.add(this._params.target._position)

    const terrain = this.FindEntity('terrain').GetComponent('TerrainChunkManager')
    idealOffset.y = Math.max(idealOffset.y, terrain.GetHeight(idealOffset)[0] + 5.0)

    return idealOffset
  }

  _CalculateIdealLookat() {
    const idealLookat = new Vector3(0, 5, 20)
    idealLookat.applyQuaternion(this._params.target._rotation)
    idealLookat.add(this._params.target._position)
    return idealLookat
  }

  Update(timeElapsed:number) {
    const idealOffset = this._CalculateIdealOffset()
    const idealLookat = this._CalculateIdealLookat()

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.01, timeElapsed)

    this._currentPosition.lerp(idealOffset, t)
    this._currentLookat.lerp(idealLookat, t)

    this._camera.position.copy(this._currentPosition)
    this._camera.lookAt(this._currentLookat)
  }
}
