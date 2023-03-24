import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { Component } from './entity.js'
import { CHARACTER_MODELS } from '../shared/defs.js'
import { Color, MeshStandardMaterial } from 'three';

export class EquipWeapon extends Component {

  params_:any;
  target_:any;
  anchor_:any;
  _bones:any;
  name_:string|null;

  //TODO: add interface
  constructor(params:any) {
    super()
    this.params_ = params
    this.target_ = null
    this.name_ = null

    const classType = this.params_.desc.character.class
    const modelData = CHARACTER_MODELS[classType as keyof typeof CHARACTER_MODELS]
    this.anchor_ = modelData.anchors.rightHand
  }

  InitComponent() {
    this._RegisterHandler('load.character', (m:any) => this._OnCharacterLoaded(m))
    this._RegisterHandler('inventory.equip', (m:any) => this._OnEquip(m))
  }

  _OnCharacterLoaded(msg:any) {
    this._bones = msg.bones
    this._AttachTarget()
  }

  _AttachTarget() {
    if (this._bones && this.target_) {
      this._bones[this.anchor_].add(this.target_)
    }
  }

  GetItemDefinition_(name:string) {
    const database = this.FindEntity('database').GetComponent('InventoryDatabaseController')
    return database.Find(name)
  }

  _OnEquip(msg:any) {
    if (msg.value == this.name_) {
      return
    }

    if (this.target_) {
      this._UnloadModels()
    }
    const inventory = this.GetComponent('InventoryController')
    const item = this.GetItemDefinition_(msg.value)

    this.name_ = msg.value

    if (item) {
      this._LoadModels(item, () => {
        this._AttachTarget()
      })
    }
  }

  _UnloadModels() {
    if (this.target_) {
      this.target_.parent.remove(this.target_)
      // Probably need to free the memory properly, whatever
      this.target_ = null
    }
  }

  _LoadModels(item:any, cb:any) {
    const loader = new FBXLoader()
    loader.setPath('./resources/weapons/FBX/')
    loader.load(item.renderParams.name + '.fbx', (fbx:any) => {
      this.target_ = fbx
      this.target_.scale.setScalar(item.renderParams.scale)
      // this.target_.rotateY(Math.PI);
      this.target_.rotateX(Math.PI / 2)
      // this.target_.rotateY(-1);

      this.target_.traverse((c:any) => {
        c.castShadow = true
        c.receiveShadow = true

        // Do this instead of something smart like re-exporting.
        let materials = c.material
        let newMaterials = []
        if (!(c.material instanceof Array)) {
          materials = [c.material]
        }

        for (let m of materials) {
          if (m) {
            const c = new Color().copy(m.color)
            c.multiplyScalar(0.75)
            newMaterials.push(
              new MeshStandardMaterial({
                color: c,
                name: m.name,
                metalness: 1.0
              })
            )
          }
        }

        if (!(c.material instanceof Array)) {
          c.material = newMaterials[0]
        } else {
          c.material = newMaterials
        }
      })

      cb()

      this.Broadcast({
        topic: 'load.weapon',
        model: this.target_,
        bones: this._bones
      })
    })
  }
}
