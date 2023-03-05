import { Component, Entity } from './entity'
import { BasicCharacterControllerInput } from './PlayerInput'
import { BasicCharacterController } from './playerEntity'
import { EquipWeapon } from './equipWeaponComponent'
import { InventoryController, UIInventoryController } from './inventoryController'
import { SpatialGridController } from './spatialGridController'
import { NetworkEntityController } from './networkEntityController'
import { NetworkPlayerController } from './networkPlayerController'
import { FloatingName } from './FloatingName'
import { NPCController } from './npcEntity.js'
import { HealthComponent } from './healthComponent'
import { AttackController } from './AttackerController'
import { ThirdPersonCamera } from './thirdPersonCamera'
import { BloodEffect } from './bloodEffect'
import { SorcerorEffect } from './sorcerorEffect'

export class PlayerSpawner extends Component {
  
  params_:any;
  
  //TODO: interface
  constructor(params:any) {
    super()
    this.params_ = params
  }

  Spawn(playerParams:any) {
    const params:any = {
      camera: this.params_.camera,
      scene: this.params_.scene,
      desc: playerParams
    }

    const player = new Entity()
    player.Account = playerParams.account
    player.AddComponent(new BasicCharacterControllerInput(params))
    player.AddComponent(new BasicCharacterController(params))
    player.AddComponent(new EquipWeapon({ desc: playerParams }))
    player.AddComponent(new UIInventoryController())
    player.AddComponent(new InventoryController())
    player.AddComponent(
      new HealthComponent({
        updateUI: true,
        health: 1,
        maxHealth: 1,
        strength: 1,
        wisdomness: 1,
        benchpress: 1,
        curl: 1,
        experience: 1,
        level: 1,
        desc: playerParams
      })
    )
    player.AddComponent(new SpatialGridController({ grid: this.params_.grid }))
    player.AddComponent(new AttackController())
    player.AddComponent(
      new ThirdPersonCamera({
        camera: this.params_.camera,
        target: player
      })
    )
    player.AddComponent(
      new NetworkPlayerController({
        camera: this.params_.camera,
        target: player
      })
    )
    player.AddComponent(
      new BloodEffect({
        camera: this.params_.camera,
        scene: this.params_.scene
      })
    )
    if (playerParams.character.class == 'sorceror') {
      player.AddComponent(new SorcerorEffect(params))
    }
    this.Manager.Add(player, 'player')

    return player
  }
}

export class NetworkEntitySpawner extends Component {
  
  params_:any;
  //TODO : interface
  constructor(params:any) {
    super()
    this.params_ = params
  }

  Spawn(name:string, desc:any) {
    const npc = new Entity()
    npc.Account = desc.account
    npc.AddComponent(
      new NPCController({
        camera: this.params_.camera,
        scene: this.params_.scene,
        desc: desc
      })
    )
    npc.AddComponent(
      new HealthComponent({
        health: 50,
        maxHealth: 50,
        strength: 2,
        wisdomness: 2,
        benchpress: 3,
        curl: 1,
        experience: 0,
        level: 1,
        desc: desc
      })
    )
    npc.AddComponent(new SpatialGridController({ grid: this.params_.grid }))
    npc.AddComponent(new NetworkEntityController())
    if (desc.account.name) {
      npc.AddComponent(new FloatingName({ desc: desc }))
    }
    npc.AddComponent(new EquipWeapon({ desc: desc }))
    npc.AddComponent(new InventoryController())
    npc.AddComponent(
      new BloodEffect({
        camera: this.params_.camera,
        scene: this.params_.scene
      })
    )
    if (desc.character.class == 'sorceror') {
      npc.AddComponent(
        new SorcerorEffect({
          camera: this.params_.camera,
          scene: this.params_.scene
        })
      )
    }

    this.Manager.Add(npc, name)

    return npc
  }
}
