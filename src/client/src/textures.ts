import * as THREE from 'three';
import { DataTexture2DArray, LinearFilter, LinearMipMapLinearFilter, LoadingManager, RepeatWrapping, RGBAFormat, sRGBEncoding, TextureLoader, UnsignedByteType } from 'three';


// Taken from https://github.com/mrdoob/three.js/issues/758
function _GetImageData(image:any) {
  var canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  var context = canvas.getContext('2d')
  context!.drawImage(image, 0, 0)

  return context!.getImageData(0, 0, image.width, image.height)
}


export class TextureAtlas  {

  _threejs:any
  onLoad:any
  _manager:LoadingManager
  _loader:TextureLoader
  _textures:any

  constructor(params:any) {
    this._threejs = params.threejs
    this.onLoad = () => {}

    //this._Create()
    this._manager = new LoadingManager()
    this._loader = new TextureLoader(this._manager)
    this._textures = {}
    this._manager.onLoad = () => {
      this._OnLoad()
    }
  }

  Load(atlas:any, names:any) {
    this._LoadAtlas(atlas, names)
  }

  _Create() {
    this._manager = new LoadingManager()
    this._loader = new TextureLoader(this._manager)
    this._textures = {}

    this._manager.onLoad = () => {
      this._OnLoad()
    }
  }

  get Info() {
    return this._textures
  }

  _LoadTexture(n:any) {
    const t = this._loader.load(n)
    t.encoding = sRGBEncoding
    return t
  }

  _OnLoad() {
    for (let k in this._textures) {
      const atlas = this._textures[k]
      const data = new Uint8Array(atlas.textures.length * 4 * 1024 * 1024)

      for (let t = 0; t < atlas.textures.length; t++) {
        const curTexture = atlas.textures[t]
        const curData = _GetImageData(curTexture.image)
        const offset = t * (4 * 1024 * 1024)

        data.set(curData.data, offset)
      }

      //TODO:
      const diffuse = new DataTexture2DArray(data, 1024, 1024, atlas.textures.length)
      diffuse.format = RGBAFormat
      diffuse.type = UnsignedByteType
      diffuse.minFilter = LinearMipMapLinearFilter
      diffuse.magFilter = LinearFilter
      diffuse.wrapS = RepeatWrapping
      diffuse.wrapT = RepeatWrapping
      diffuse.generateMipmaps = true

      const caps = this._threejs.capabilities
      const aniso = caps.getMaxAnisotropy()

      diffuse.anisotropy = 4

      atlas.atlas = diffuse
    }

    this.onLoad()
  }

  _LoadAtlas(atlas:any, names:any) {
    this._textures[atlas] = {
      textures: names.map((n:any) => this._LoadTexture(n)),
      atlas: null
    }
  }
}

