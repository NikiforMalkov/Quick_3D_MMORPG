import * as THREE from 'three';

export class Entity {

  _name: string;
  _components:any = {};
  _position: THREE.Vector3;
  _rotation: THREE.Quaternion;
  dead_:boolean = false;
  parent_:any = null;
  _handlers:any = {};
  Account:any

  constructor() {
    this._name = ''
    this._components = {}

    this._position = new THREE.Vector3()
    this._rotation = new THREE.Quaternion()
    this._handlers = {}
    this.parent_ = null
    this.dead_ = false
  }

  Destroy() {
    for (let k in this._components) {
      this._components[k].Destroy()
    }
    this._components = null
    this.parent_ = null
    this._handlers = null
  }

  _RegisterHandler(n:any, h:any) {
    if (!(n in this._handlers)) {
      this._handlers[n] = []
    }
    this._handlers[n].push(h)
  }

  SetParent(p:any) {
    this.parent_ = p
  }

  SetName(n:string) {
    this._name = n
  }

  get Name(): string {
    return this._name
  }

  get Manager() {
    return this.parent_
  }

  SetActive(b:boolean) {
    this.parent_.SetActive(this, b)
  }

  SetDead() {
    this.dead_ = true
  }

  AddComponent(c:any) {
    c.SetParent(this)
    this._components[c.constructor.name] = c

    c.InitComponent()
  }

  InitEntity() {
    for (let k in this._components) {
      this._components[k].InitEntity()
    }
  }

  GetComponent(n:any) {
    return this._components[n]
  }

  FindEntity(n:any) {
    return this.parent_.Get(n)
  }

  Broadcast(msg:any) {
    if (!(msg.topic in this._handlers)) {
      return
    }

    for (let curHandler of this._handlers[msg.topic]) {
      curHandler(msg)
    }
  }

  SetPosition(p:THREE.Vector3) {
    this._position.copy(p)
    this.Broadcast({
      topic: 'update.position',
      value: this._position
    })
  }

  SetQuaternion(r:THREE.Quaternion) {
    this._rotation.copy(r)
    this.Broadcast({
      topic: 'update.rotation',
      value: this._rotation
    })
  }

  get Position() {
    return this._position
  }

  get Quaternion() {
    return this._rotation
  }

  Update(timeElapsed:number) {
    for (let k in this._components) {
      this._components[k].Update(timeElapsed)
    }
  }
}

export class Component {

  public parent_:any = null;

  constructor() {
    this.parent_ = null
  }

  Destroy() {}

  SetParent(p:any) {
    this.parent_ = p
  }

  InitComponent() {}

  InitEntity() {}

  GetComponent(n:any) {
    return this.parent_.GetComponent(n)
  }

  get Manager() {
    return this.parent_.Manager
  }

  get Parent() {
    return this.parent_
  }

  FindEntity(n:any) {
    return this.parent_.FindEntity(n)
  }

  Broadcast(m:any) {
    this.parent_.Broadcast(m)
  }

  Update(_:number) {}

  _RegisterHandler(n:any, h:any) {
    this.parent_._RegisterHandler(n, h)
  }
}

