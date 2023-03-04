import { Box3, Matrix4, Vector3 } from "three"

export class CubeQuadTree {

  _params:any
  _sides:any

  constructor(params:any) {
    this._params = params
    this._sides = []

    const r = params.radius
    let m

    const transforms = []

    // +Y
    m = new Matrix4()
    m =
      // m.makeRotationX(-Math.PI / 2);
      // m.premultiply(new THREE.Matrix4().makeTranslation(0, r, 0));
      transforms.push(m)

    // // -Y
    // m = new THREE.Matrix4();
    // m.makeRotationX(Math.PI / 2);
    // m.premultiply(new THREE.Matrix4().makeTranslation(0, -r, 0));
    // transforms.push(m);

    // // +X
    // m = new THREE.Matrix4();
    // m.makeRotationY(Math.PI / 2);
    // m.premultiply(new THREE.Matrix4().makeTranslation(r, 0, 0));
    // transforms.push(m);

    // // -X
    // m = new THREE.Matrix4();
    // m.makeRotationY(-Math.PI / 2);
    // m.premultiply(new THREE.Matrix4().makeTranslation(-r, 0, 0));
    // transforms.push(m);

    // // +Z
    // m = new THREE.Matrix4();
    // m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, r));
    // transforms.push(m);

    // // -Z
    // m = new THREE.Matrix4();
    // m.makeRotationY(Math.PI);
    // m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, -r));
    // transforms.push(m);

    for (let t of transforms) {
      this._sides.push({
        transform: t.clone(),
        quadtree: new QuadTree({
          size: r,
          min_node_size: params.min_node_size
        })
      })
    }
  }

  GetChildren() {
    const children = []

    for (let s of this._sides) {
      const side = {
        transform: s.transform,
        children: s.quadtree.GetChildren()
      }
      children.push(side)
    }
    return children
  }

  Insert(pos:any) {
    for (let s of this._sides) {
      s.quadtree.Insert(pos)
    }
  }
}

export class QuadTree {

  _root:any
  _params:any

  constructor(params:any) {
    const s = params.size
    const b = new Box3(new Vector3(-s, 0, -s), new Vector3(s, 0, s))
    this._root = {
      bounds: b,
      children: [],
      center: b.getCenter(new Vector3()),
      size: b.getSize(new Vector3()),
      root: true
    }

    this._params = params
  }

  GetChildren() {
    const children:any = []
    this._GetChildren(this._root, children)
    return children
  }

  _GetChildren(node:any, target:any) {
    if (node.children.length == 0) {
      target.push(node)
      return
    }

    for (let c of node.children) {
      this._GetChildren(c, target)
    }
  }

  Insert(pos:any) {
    this._Insert(this._root, pos)
  }

  _Insert(child:any, pos:any) {
    const distToChild = this._DistanceToChild(child, pos)

    if (distToChild < child.size.x * 1.5 && child.size.x > this._params.min_node_size) {
      child.children = this._CreateChildren(child)

      for (let c of child.children) {
        this._Insert(c, pos)
      }
    }
  }

  _DistanceToChild(child:any, pos:any) {
    return child.center.distanceTo(pos)
  }

  _CreateChildren(child:any) {
    const midpoint = child.bounds.getCenter(new Vector3())

    // Bottom left
    const b1 = new Box3(child.bounds.min, midpoint)

    // Bottom right
    const b2 = new Box3(
      new Vector3(midpoint.x, 0, child.bounds.min.z),
      new Vector3(child.bounds.max.x, 0, midpoint.z)
    )

    // Top left
    const b3 = new Box3(
      new Vector3(child.bounds.min.x, 0, midpoint.z),
      new Vector3(midpoint.x, 0, child.bounds.max.z)
    )

    // Top right
    const b4 = new Box3(midpoint, child.bounds.max)

    const children = [b1, b2, b3, b4].map((b) => {
      return {
        bounds: b,
        children: [],
        center: b.getCenter(new Vector3()),
        size: b.getSize(new Vector3())
      }
    })

    return children
  }
}

