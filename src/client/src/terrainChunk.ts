import { BufferGeometry, Float32BufferAttribute, Mesh } from "three"

export class TerrainChunk {

  _params:any
  _plane:Mesh|any
  _geometry:BufferGeometry|any

  constructor(params:any) {
    this._params = params
    this._Init(params)
  }

  Destroy() {
    this._params.group.remove(this._plane)
  }

  Hide() {
    this._plane.visible = false
  }

  Show() {
    this._plane.visible = true
  }

  _Init(params:any) {
    this._geometry = new BufferGeometry()
    this._plane = new Mesh(this._geometry, params.material)
    this._plane.castShadow = false
    this._plane.receiveShadow = true
    this._plane.frustumCulled = false
    this._params.group.add(this._plane)
    this.Reinit(params)
  }

  Update(cameraPosition:any) {
    // this._plane.position.copy(this._params.origin);
    // this._plane.position.sub(cameraPosition);
  }

  Reinit(params:any) {
    this._params = params
    this._plane.position.set(0, 0, 0)
  }

  RebuildMeshFromData(data:any) {
    this._geometry.setAttribute('position', new Float32BufferAttribute(data.positions, 3))
    this._geometry.setAttribute('color', new Float32BufferAttribute(data.colours, 3))
    this._geometry.setAttribute('normal', new Float32BufferAttribute(data.normals, 3))
    this._geometry.setAttribute('coords', new Float32BufferAttribute(data.coords, 3))
    this._geometry.setAttribute('weights1', new Float32BufferAttribute(data.weights1, 4))
    this._geometry.setAttribute('weights2', new Float32BufferAttribute(data.weights2, 4))
    this._geometry.computeBoundingBox()
  }
}

