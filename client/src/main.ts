import { SpatialHashGrid } from "../../shared/spatialHashGrid.js";
import { Entity } from "./entity.js";
import { EntityManager } from "./entityManager.js"
import { LoadController } from "./loadController.js";
import { NetworkController } from "./networkController.js";
import { SceneryController } from "./sceneryController.js";
import { TerrainChunkManager } from "./terrain.js";
import { ThreeJSController } from "./threejsComponent.js";
import { UIController } from "./uiСontroller.js";
import { GUI } from '../dat.gui.module.js'
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { NetworkEntitySpawner, PlayerSpawner } from "./spawners.js";
import { InventoryDatabaseController } from "./inventoryController.js";
import { LevelUpComponentSpawner } from "./levelUpComponent.js";
import { WEAPONS_DATA } from '../../shared/defs.js'

class CrappyMMOAttempt {

  entityManager_:EntityManager = new EntityManager();
  grid_:SpatialHashGrid = new SpatialHashGrid(
    [
      [-1000, -1000],
      [1000, 1000]
    ],
    [100, 100]
  );
  previousRAF_:any;
  _gui: typeof GUI|any;
  scene_:Scene|any;
  camera_:PerspectiveCamera|any;
  threejs_:WebGLRenderer|any;
  _guiParams:any;

  constructor() {
    this._Initialize()
  }

  _Initialize() {
    this.entityManager_ = new EntityManager()

    document.getElementById('login-ui')!.style.visibility = 'visible'
    document.getElementById('login-button')!.onclick = () => {
      this.OnGameStarted_()
    }
  }

  OnGameStarted_() {
    this.CreateGUI_()

    this.grid_ = new SpatialHashGrid(
      [
        [-1000, -1000],
        [1000, 1000]
      ],
      [100, 100]
    )

    this.LoadControllers_()
    this.LoadPlayer_()

    this.previousRAF_ = null
    this.RAF_()
  }

  CreateGUI_() {
    this._guiParams = {
      general: {}
    }
    //TODO: подумать что-то с gui
    this._gui = new GUI()

    const generalRollup = this._gui.addFolder('General')
    this._gui.close()
  }

  LoadControllers_() {
    const threejs = new Entity()
    threejs.AddComponent(new ThreeJSController())
    this.entityManager_.Add(threejs)

    //TODO: очень неудобная фигня
    // Hack
    this.scene_ = threejs.GetComponent('ThreeJSController').scene_
    this.camera_ = threejs.GetComponent('ThreeJSController').camera_
    this.threejs_ = threejs.GetComponent('ThreeJSController').threejs_

    const ui = new Entity()
    ui.AddComponent(new UIController())
    this.entityManager_.Add(ui, 'ui')

    const network = new Entity()
    network.AddComponent(new NetworkController())
    this.entityManager_.Add(network, 'network')

    const t = new Entity()
    t.AddComponent(
      new TerrainChunkManager({
        scene: this.scene_,
        target: 'player',
        gui: this._gui,
        guiParams: this._guiParams,
        threejs: this.threejs_
      })
    )
    this.entityManager_.Add(t, 'terrain')

    const l = new Entity()
    l.AddComponent(new LoadController())
    this.entityManager_.Add(l, 'loader')

    const scenery = new Entity()
    scenery.AddComponent(
      new SceneryController({
        scene: this.scene_,
        grid: this.grid_
      })
    )
    this.entityManager_.Add(scenery, 'scenery')

    const spawner = new Entity()
    spawner.AddComponent(
      new PlayerSpawner({
        grid: this.grid_,
        scene: this.scene_,
        camera: this.camera_
      })
    )
    spawner.AddComponent(
      new NetworkEntitySpawner({
        grid: this.grid_,
        scene: this.scene_,
        camera: this.camera_
      })
    )
    this.entityManager_.Add(spawner, 'spawners')

    const database = new Entity()
    database.AddComponent(new InventoryDatabaseController())
    this.entityManager_.Add(database, 'database')

    // HACK
    for (let k in WEAPONS_DATA) {
      database.GetComponent('InventoryDatabaseController').AddItem(k, WEAPONS_DATA[k as keyof typeof WEAPONS_DATA])
    }
  }

  LoadPlayer_() {
    const params = {
      camera: this.camera_,
      scene: this.scene_
    }

    const levelUpSpawner = new Entity()
    levelUpSpawner.AddComponent(
      new LevelUpComponentSpawner({
        camera: this.camera_,
        scene: this.scene_
      })
    )
    this.entityManager_.Add(levelUpSpawner, 'level-up-spawner')
  }

  _OnWindowResize() {
    this.camera_.aspect = window.innerWidth / window.innerHeight
    this.camera_.updateProjectionMatrix()
    this.threejs_.setSize(window.innerWidth, window.innerHeight)
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t
      }

      this.threejs_.render(this.scene_, this.camera_)
      this.Step_(t - this.previousRAF_)
      this.previousRAF_ = t

      setTimeout(() => {
        this.RAF_()
      }, 1)
    })
  }

  Step_(timeElapsed:number) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001)

    this.entityManager_.Update(timeElapsedS)
  }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
  _APP = new CrappyMMOAttempt()
})
