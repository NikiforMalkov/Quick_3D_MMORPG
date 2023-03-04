import { Entity } from "./entity";

export  class EntityManager {

  _ids: number = 0; 
  _entitiesMap:Map<string, Entity> = new Map<string, Entity>();
  _entities: Entity[];

    constructor() {
      this._ids = 0
      this._entitiesMap 
      this._entities = new Array<Entity>();
    }

    _GenerateName(): string {
      this._ids += 1

      return '__name__' + this._ids
    }

    Get(n:string) {
      return this._entitiesMap.get(n);
    }

    Filter(cb:any) {
      return this._entities.filter(cb)
    }

    Add(e:Entity, n: string | null = null) {
      if (!n) {
        n = this._GenerateName()
      }

      this._entitiesMap.set(n, e);
      this._entities.push(e)

      e.SetParent(this)
      e.SetName(n)
      e.InitEntity()
    }

    SetActive(e:Entity, b:boolean) {
      const i = this._entities.indexOf(e)

      if (!b) {
        if (i < 0) {
          return
        }

        this._entities.splice(i, 1)
      } else {
        if (i >= 0) {
          return
        }

        this._entities.push(e)
      }
    }

    Update(timeElapsed:number) {
      const dead:Entity[] = new Array<Entity>();
      const alive:Entity[] = new Array<Entity>();
      for (let i = 0; i < this._entities.length; ++i) {
        const e = this._entities[i]

        e.Update(timeElapsed)

        if (e.dead_) {
          dead.push(e)
        } else {
          alive.push(e)
        }
      }

      for (let i = 0; i < dead.length; ++i) {
        const e = dead[i]

        const name = e.Name
        this._entitiesMap.delete(name)

        e.Destroy()
      }

      this._entities = alive
    }
  }