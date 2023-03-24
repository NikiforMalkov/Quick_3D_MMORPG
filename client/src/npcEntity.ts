import { AnimationMixer, Group, sRGBEncoding } from "three"
import { CHARACTER_MODELS } from "../shared/defs.js"
import { Component } from "./entity.js"
import { BasicCharacterControllerProxy, CharacterFSM } from "./playerEntity.js"

export class NPCController extends Component {

  params_:any
  group_:Group|any
  animations_:any
  queuedState_:any
  stateMachine_:any
  bones_:any
  target_:any
  mixer_:AnimationMixer|any

  constructor(params:any) {
    super()
    this.params_ = params
  }

  Destroy() {
    this.group_.traverse((c:any) => {
      if (c.material) {
        let materials = c.material
        if (!(c.material instanceof Array)) {
          materials = [c.material]
        }
        for (let m of materials) {
          m.dispose()
        }
      }

      if (c.geometry) {
        c.geometry.dispose()
      }
    })
    this.params_.scene.remove(this.group_)
  }

  InitEntity() {
    this._Init()
  }

  _Init() {
    this.animations_ = {}
    this.group_ = new Group()

    this.params_.scene.add(this.group_)
    this.queuedState_ = null

    this.LoadModels_()
  }

  InitComponent() {
    this._RegisterHandler('health.death', (m:any) => {
      this.OnDeath_(m)
    })
    this._RegisterHandler('update.position', (m:any) => {
      this.OnPosition_(m)
    })
    this._RegisterHandler('update.rotation', (m:any) => {
      this.OnRotation_(m)
    })
  }

  SetState(s:any) {
    if (!this.stateMachine_) {
      this.queuedState_ = s
      return
    }

    // hack: should propogate attacks through the events on server
    // Right now, they're inferred from whatever animation we're running, blech
    if (s == 'attack' && this.stateMachine_._currentState.Name != 'attack') {
      this.Broadcast({
        topic: 'action.attack'
      })
    }

    this.stateMachine_.SetState(s)
  }

  OnDeath_(msg:any) {
    this.SetState('death')
  }

  OnPosition_(m:any) {
    this.group_.position.copy(m.value)
  }

  OnRotation_(m:any) {
    this.group_.quaternion.copy(m.value)
  }

  LoadModels_() {
    const classType = this.params_.desc.character.class
    const modelData = CHARACTER_MODELS[classType as keyof typeof CHARACTER_MODELS]

    const loader = this.FindEntity('loader').GetComponent('LoadController')
    loader.LoadSkinnedGLB(modelData.path, modelData.base, (glb:any) => {
      this.target_ = glb.scene
      this.target_.scale.setScalar(modelData.scale)
      this.target_.visible = false

      this.group_.add(this.target_)

      this.bones_ = {}
      this.target_.traverse((c:any) => {
        if (!c.skeleton) {
          return
        }
        for (let b of c.skeleton.bones) {
          this.bones_[b.name] = b
        }
      })

      this.target_.traverse((c:any) => {
        c.castShadow = true
        c.receiveShadow = true
        if (c.material && c.material.map) {
          c.material.map.encoding = sRGBEncoding
        }
      })

      this.mixer_ = new AnimationMixer(this.target_)

      const _FindAnim = (animName:any) => {
        for (let i = 0; i < glb.animations.length; i++) {
          if (glb.animations[i].name.includes(animName)) {
            const clip = glb.animations[i]
            const action = this.mixer_.clipAction(clip)
            return {
              clip: clip,
              action: action
            }
          }
        }
        return null
      }

      this.animations_['idle'] = _FindAnim('Idle')
      this.animations_['walk'] = _FindAnim('Walk')
      this.animations_['run'] = _FindAnim('Run')
      this.animations_['death'] = _FindAnim('Death')
      this.animations_['attack'] = _FindAnim('Attack')
      this.animations_['dance'] = _FindAnim('Dance')

      this.target_.visible = true

      this.stateMachine_ = new CharacterFSM(
        new BasicCharacterControllerProxy(this.animations_)
      )

      if (this.queuedState_) {
        this.stateMachine_.SetState(this.queuedState_)
        this.queuedState_ = null
      } else {
        this.stateMachine_.SetState('idle')
      }

      this.Broadcast({
        topic: 'load.character',
        model: this.group_,
        bones: this.bones_
      })
    })
  }

  Update(timeInSeconds:number) {
    if (!this.stateMachine_) {
      return
    }
    this.stateMachine_.Update(timeInSeconds, null)

    if (this.mixer_) {
      this.mixer_.update(timeInSeconds)
    }
  }
}