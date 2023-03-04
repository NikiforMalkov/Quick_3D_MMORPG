import { Color } from "three"
import { Component, Entity } from "./entity"
import { ParticleSystem } from "./particleSystem"

export class LevelUpComponentSpawner extends Component {

  _params:any;

  //TODO: interface
  constructor(params:any) {
    super()
    this._params = params
  }

  Spawn(pos:any) {
    const e = new Entity()
    e.SetPosition(pos)
    e.AddComponent(new LevelUpComponent(this._params))
    this.Manager.Add(e)

    return e
  }
}

export class LevelUpComponent extends Component {

  _params:any
  _particles:ParticleSystem

  //TODO: interface
  constructor(params:any) {
    super()
    this._params = params

    this._particles = new ParticleSystem({
      camera: params.camera,
      parent: params.scene,
      texture: './resources/textures/ball.png'
    })

    /*
    //TODO: разобраться с этим
    this._particles._alphaSpline.AddPoint(0.0, 0.0)
    this._particles._alphaSpline.AddPoint(0.1, 1.0)
    this._particles._alphaSpline.AddPoint(0.7, 1.0)
    this._particles._alphaSpline.AddPoint(1.0, 0.0)

    this._particles._colourSpline.AddPoint(0.0, new Color(0x00ff00))
    this._particles._colourSpline.AddPoint(0.5, new Color(0x40c040))
    this._particles._colourSpline.AddPoint(1.0, new Color(0xff4040))

    this._particles._sizeSpline.AddPoint(0.0, 0.05)
    this._particles._sizeSpline.AddPoint(0.5, 0.25)
    this._particles._sizeSpline.AddPoint(1.0, 0.0)
    */
  }

  InitComponent() {
    //this._particles.AddParticles(this.Parent.Position, 300)
  }

  Update(timeElapsed:number) {
    /*
    this._particles.Step(timeElapsed)
    if (this._particles._particles.length == 0) {
      this.Parent.SetActive(false)
    }
    */
  }
}
