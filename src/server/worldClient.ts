import { quat, vec3 } from "gl-matrix";
import { HeightGenerator } from "../client/shared/terrainHeight";
import { DescriptionInterface, StatsInterface, WorldEntity, WorldEntityInteface } from "./worldEntity";
import { SocketWrapperInterface } from "./worldServer";

export const _TIMEOUT = 600.0;

interface ChatMessageInterface {
  name: string,
  server?: boolean,
  text: string,
}

  export interface WorldClientInteface {
    entity_:WorldEntity | null;

    Destroy(): void
    OnDeath(): void
    OnEntityEvent_(t:string, d:number): void
    OnMessage_(evt:string, data:any): void
    OnDamageEvent_(_:any): void
    OnInventoryChanged_(inventory:any): void
    OnChatMessage_(message:string): void
    BroadcastChat(chatMessage:ChatMessageInterface): void
    get IsDead(): boolean
    OnUpdate_(timeElapsed:number): void
    OnUpdateClientState_(): void
    UpdateClientState_(): void
    Update(timeElapsed:number): void
  }

  class WorldClient implements WorldClientInteface {

    public entity_:WorldEntity | null;
    public client_:SocketWrapperInterface | null;
    public timeout_:number;
    public entityCache_;

    constructor(client: SocketWrapperInterface, entity:WorldEntity) {
      this.entity_ = entity;

      //TODO: remove hack
      // Hack
      this.entity_.onEvent_ = (t:string, d:number) => this.OnEntityEvent_(t, d);

      this.client_ = client;
      this.client_['onMessage'] = (e:string, d:any) => this.OnMessage_(e, d);
      this.client_.Send("world.player", this.entity_.CreatePlayerPacket_());
      this.client_.Send("world.stats", this.entity_.CreateStatsPacket_());

      this.timeout_ = _TIMEOUT;

      this.entityCache_ = {};

      //TODO: remove hack
      // Hack
      entity.parent_ = this;
    }

    Destroy() {
      if (this.client_ == null && this.entity_ == null) return;
      (this.client_ as SocketWrapperInterface).Disconnect();
      this.client_ = null;

      (this.entity_ as WorldEntity).Destroy();
      this.entity_ = null;
    }

    OnDeath() {}

    OnEntityEvent_(t:string, d:number) {
      if (t == "attack.damage") {
        this.OnDamageEvent_(d);
      }
    }

    OnMessage_(evt:string, data:any) {
      this.timeout_ = _TIMEOUT;

      if (evt == "world.update") {
        this.entity_!.UpdateTransform(data);
        return true;
      }

      if (evt == "chat.msg") {
        this.OnChatMessage_(data);
        return true;
      }

      if (evt == "action.attack") {
        this.entity_!.OnActionAttack();
        return true;
      }

      if (evt == "world.inventory") {
        this.OnInventoryChanged_(data);
        return true;
      }

      return false;
    }

    OnDamageEvent_(_:any) {}

    OnInventoryChanged_(inventory:any) {
      this.entity_!.UpdateInventory(inventory);

      // Todo: Merge this into entityCache_ path.
      const nearby = this.entity_!.FindNear(50, true);

      for (let n of nearby) {
        n!.parent_.client_.Send("world.inventory", [this.entity_!.ID, inventory]);
      }
    }

    OnChatMessage_(message:string) {
      const chatMessage = {
        name: this.entity_!.accountInfo_.name,
        text: message,
      };

      this.BroadcastChat(chatMessage);
    }

    BroadcastChat(chatMessage:ChatMessageInterface) {
      const nearby = this.entity_!.FindNear(50, true);

      for (let i = 0; i < nearby.length; ++i) {
        const n = nearby[i];
        n!.parent_.client_.Send("chat.message", chatMessage);
      }
    }

    get IsDead() {
      return this.timeout_ <= 0.0;
    }

    OnUpdate_(timeElapsed:number) {}

    OnUpdateClientState_() {}

    UpdateClientState_() {
      this.OnUpdateClientState_();
    }

    Update(timeElapsed:number) {
      this.timeout_ -= timeElapsed;

      this.entity_!.Update(timeElapsed);

      this.OnUpdate_(timeElapsed);
    }
  }

  interface currentInterface {
    id: number
    transform: (string | number[])[]
    stats: (number | StatsInterface)[]
    events: any[]
    desc?:DescriptionInterface
  }

  export class WorldNetworkClient extends WorldClient {
    
    constructor(client:SocketWrapperInterface, entity: WorldEntity) {
      super(client, entity);
    }

    OnUpdate_(timeElapsed:number) {}

    OnUpdateClientState_() {
      const _Filter = (e:WorldEntityInteface) => {
        return e.ID != this.entity_!.ID;
      };

      const nearby = this.entity_!.FindNear(500).filter((e:any) => _Filter(e));

      const updates = [
        {
          id: this.entity_!.ID,
          stats: this.entity_!.CreateStatsPacket_(),
          events: this.entity_!.CreateEventsPacket_(),
        },
      ];
      const newCache_:any = {};

      for (let n of nearby) {
        // We could easily trim this down based on what we know
        // this client saw last. Maybe do it later.
        const cur:currentInterface = {
          id: n!.ID,
          transform: n!.CreateTransformPacket_(),
          stats: n!.CreateStatsPacket_(),
          events: n!.CreateEventsPacket_(),
        };

        if (!(n!.ID in this.entityCache_)) {
          cur.desc = n!.GetDescription();
        }

        newCache_[n!.ID] = cur;
        updates.push(cur);
      }

      this.entityCache_ = newCache_;

      this.client_!.Send("world.update", updates);
    }
  }

  class AIStateMachine {

    currentState_:any;
    entity_: WorldEntity;
    terrain_: HeightGenerator;

    constructor(entity:WorldEntity, terrain: HeightGenerator) {
      this.currentState_ = null;
      this.entity_ = entity;
      this.terrain_ = terrain;
    }

    SetState(state:any) {
      const prevState = this.currentState_;

      if (prevState) {
        if (prevState.constructor.name == state.constructor.name) {
          return;
        }
        prevState.Exit();
      }

      this.currentState_ = state;
      this.currentState_.parent_ = this;
      this.currentState_.entity_ = this.entity_;
      this.currentState_.terrain_ = this.terrain_;
      state.Enter(prevState);
    }

    Update(timeElapsed:number) {
      if (this.currentState_) {
        this.currentState_.Update(timeElapsed);
      }
    }
  }

class AIState {
  constructor() {}
  Exit() {}
  Enter() {}
  Update(timeElapsed:number) {}
}

class AIState_JustSitThere extends AIState {

  timer_;
  entity_:WorldEntityInteface | null = null;
  parent_:any;

  constructor(target?:WorldEntityInteface | null) {
    super();

    this.timer_ = 0.0;
  }

  UpdateLogic_() {
    const _IsPlayer = (e:any) => {
      return !e.isAI;
    };
    const nearby = this.entity_!.FindNear(50.0)
      .filter((e:any) => e.Health > 0)
      .filter(_IsPlayer);

    if (nearby.length > 0) {
      this.parent_.SetState(new AIState_FollowToAttack(nearby[0]));
    }
  }

  Update(timeElapsed:number) {
    this.timer_ += timeElapsed;
    this.entity_!.SetState("idle");

    if (this.timer_ > 5.0) {
      this.UpdateLogic_();
      this.timer_ = 0.0;
    }
  }
}

class AIState_FollowToAttack extends AIState {

  target_: WorldEntityInteface | null = null;
  entity_: WorldEntityInteface | null = null;
  terrain_:HeightGenerator | null = null;
  parent_:any;

  constructor(target: WorldEntityInteface | undefined | null = null) {
    super();
    this.target_ = target;
  }

  UpdateMovement_(timeElapsed:number) {
    this.entity_!.state_ = "walk";

    const direction = vec3.create();
    const forward = vec3.fromValues(0, 0, 1);

    vec3.sub(direction, this.target_!.position_, this.entity_!.position_);
    direction[1] = 0.0;

    vec3.normalize(direction, direction);
    quat.rotationTo(this.entity_!.rotation_, forward, direction);

    const movement = vec3.clone(direction);
    vec3.scale(movement, movement, timeElapsed * 10.0);

    vec3.add(this.entity_!.position_, this.entity_!.position_, movement);

    this.entity_!.position_[1] = this.terrain_!.Get(
      this.entity_!.position_[0], this.entity_!.position_[1], this.entity_!.position_[2]
    )[0];
    this.entity_!.UpdateGridClient_();

    const distance = vec3.distance(
      this.entity_!.position_,
      this.target_!.position_
    );

    if (distance < 10.0) {
      this.entity_!.OnActionAttack();
      this.parent_.SetState(new AIState_WaitAttackDone(this.target_));
    } else if (distance > 100.0) {
      this.parent_.SetState(new AIState_JustSitThere());
    }
  }

  Update(timeElapsed:number) {
    if (!this.target_!.Valid || this.target_!.Health == 0) {
      this.parent_.SetState(new AIState_JustSitThere(this.target_));
      return;
    }

    this.UpdateMovement_(timeElapsed);
  }
}

class AIState_WaitAttackDone extends AIState {
  
  target_: WorldEntityInteface | null = null;
  entity_: WorldEntityInteface | null = null;
  parent_:any;

  constructor(target:WorldEntityInteface | null) {
    super();
    this.target_ = target;
  }

  Update(_:any) {
    this.entity_!.state_ = "attack";
    if (this.entity_!.action_) {
      return;
    }

    this.parent_.SetState(new AIState_FollowToAttack(this.target_));
  }
}

class FakeClient implements SocketWrapperInterface {
  onMessage:any;
  constructor() {}
  Send(msg:string, data:any) {}
  Disconnect() {}
  get ID():string {return ""}
  get IsAlive():boolean {return false}
  SetupSocket_() {}
}

export interface onDeathInteface {
  (): void;
}

export class WorldAIClient extends WorldClient {
  
  terrain_: HeightGenerator;
  onDeath_: onDeathInteface;
  fsm_;
  deathTimer_:number;

  constructor(entity:WorldEntity, terrain: HeightGenerator, onDeath:onDeathInteface) {
    super(new FakeClient(), entity);
    this.terrain_ = terrain;
    this.onDeath_ = onDeath;
    // TODO: deal with it
    // Haha sorry
    this.entity_!.isAI = true;

    this.fsm_ = new AIStateMachine(entity, this.terrain_);
    this.fsm_.SetState(new AIState_JustSitThere());

    this.deathTimer_ = 0.0;
  }

  get IsDead() {
    return this.deathTimer_ >= 30.0;
  }

  OnDeath() {
    this.onDeath_();
  }

  OnUpdateClientState_() {}

  OnUpdate_(timeElapsed:number) {
    // Never times out
    this.timeout_ = 1000.0;

    if (this.entity_!.Health > 0) {
      this.fsm_.Update(timeElapsed);
    } else {
      this.deathTimer_ += timeElapsed;
    }
  }
}
