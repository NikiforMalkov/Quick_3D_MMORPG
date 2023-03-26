import {quat, vec3} from "gl-matrix";
import {SpatialHashGrid, SpatialHashGridClient} from "../shared/spatialHashGrid";
import {WEAPONS_DATA} from "../shared/defs";
import {
  AccountInfoInterface, ActionAttackInterface,
  DescriptionInterface, onAction, PlayerPacket,
  StatsInterface, transformInterface,
  WorldEntityInterface,
  WorldEntityParams
} from "../shared/worldEntityInterface";

export class WorldEntity implements WorldEntityInterface {

  id_:number;
  state_:string;
  position_:vec3;
  rotation_:quat;
  accountInfo_: AccountInfoInterface;
  characterDefinition_;
  characterInfo_;
  stats_:StatsInterface;
  events_:any[];
  grid_:SpatialHashGrid;
  gridClient_: SpatialHashGridClient | null;
  updateTimer_:number;
  action_: ActionAttackInterface | null;
  parent_:any;
  isAI: boolean = false;
  onEvent_:any;

  constructor(params:WorldEntityParams) {
    this.id_ = params.id;
    this.state_ = "idle";
    this.position_ = vec3.clone(params.position);
    this.rotation_ = quat.clone(params.rotation);

    // HACK
    this.accountInfo_ = {
      name: params.account.accountName,
    };
    this.characterDefinition_ = params.character.definition;
    this.characterInfo_ = {
      class: params.character.class,
      inventory: { ...this.characterDefinition_.inventory },
    };
    this.stats_ = { ...this.characterDefinition_.stats };
    this.events_ = [];
    this.grid_ = params.grid;
    this.gridClient_ = this.grid_.NewClient(
        [this.position_[0], this.position_[2]],
        [10, 10]
    );
    this.gridClient_.entity = this;

    this.updateTimer_ = 0.0;
    this.action_ = null;
  }

  Destroy() {
    this.grid_.Remove(this.gridClient_!);
    this.gridClient_ = null;
  }

  get ID() {
    return this.id_;
  }

  get Valid() {
    return this.gridClient_ != null;
  }

  get Health() {
    return this.stats_.health;
  }

  GetDescription(): DescriptionInterface {
    return {
      account: this.accountInfo_,
      character: this.characterInfo_,
    };
  }

  CreatePlayerPacket_(): PlayerPacket {
    return {
      id: this.ID,
      desc: this.GetDescription(),
      transform: this.CreateTransformPacket_(),
    };
  }

  CreateStatsPacket_():(number | StatsInterface)[] {
    return [this.ID, this.stats_];
  }

  CreateEventsPacket_() {
    return this.events_;
  }

  CreateTransformPacket_() {
    return [this.state_, [...this.position_], [...this.rotation_]];
  }

  UpdateTransform(transformData:any) {
    if (this.stats_.health <= 0) {
      this.SetState("death");
    }
    this.state_ = transformData.state;
    this.position_ = vec3.fromValues(transformData[1][0], transformData[1][1], transformData[1][2]);
    this.rotation_ = quat.fromValues(transformData[2][0], transformData[2][1], transformData[2][2], transformData[2][3]);

    this.UpdateGridClient_();
  }

  UpdateGridClient_() {
    this.gridClient_!.position = [this.position_[0], this.position_[2]];
    this.grid_.UpdateClient(this.gridClient_!);
  }

  UpdateInventory(inventory:any) {
    this.characterInfo_.inventory = inventory;
  }

  OnActionAttack() {
    if (this.action_) {
      return;
    }

    this.action_ = new Action_Attack(
        this.characterDefinition_.attack.timing,
        this.characterDefinition_.attack.cooldown,
        () => {
          this.OnActionAttack_Fired();
        }
    );
  }

  OnActionAttack_Fired() {
    // wheee hardcoded :(
    const nearby = this.FindNear(50.0);

    const _Filter = (c:any) => {
      if (c.Health == 0) {
        return false;
      }

      const dist = vec3.distance(c.position_, this.position_);
      return dist <= this.characterDefinition_.attack.range;
    };

    const attackable = nearby.filter(_Filter);
    for (let a of attackable) {
      const target = a;

      const dirToTarget = vec3.create();
      vec3.sub(dirToTarget, target!.position_, this.position_);
      vec3.normalize(dirToTarget, dirToTarget);

      const forward = vec3.fromValues(0, 0, 1);
      vec3.transformQuat(forward, forward, this.rotation_);
      vec3.normalize(forward, forward);

      const dot = vec3.dot(forward, dirToTarget);
      if (dot < 0.9 || dot > 1.1) {
        continue;
      }

      // Calculate damage, use equipped weapon + whatever, this will be bad.
      let damage = 0;

      console.log("attacking: " + target!.accountInfo_.name);

      if (this.characterDefinition_.attack.type == "melee") {
        damage = this.stats_.strength / 5.0;

        const equipped = this.characterInfo_.inventory["inventory-equip-1"];
        if (equipped) {
          console.log(" equipped: " + equipped);
          const weapon = WEAPONS_DATA[equipped as keyof typeof WEAPONS_DATA];
          if (weapon) {
            damage *= weapon.damage * 10;
          }
        }
      } else {
        damage = this.stats_.wisdomness / 10.0;
      }

      console.log(" damage: " + damage);

      target!.OnDamage(this, damage);

      //TODO: think about it
      this['onEvent_']("attack.damage", { target: target, damage: damage });
    }
  }

  OnDamage(attacker:WorldEntityInterface, damage:number) {
    this.stats_.health -= damage;
    this.stats_.health = Math.max(0.0, this.stats_.health);
    //TODO: maybe we need enum
    this.events_.push({
      type: "attack",
      target: this.ID,
      attacker: attacker.ID,
      amount: damage,
    });

    if (this.stats_.health <= 0) {
      this.SetState("death");
    }
  }

  SetState(s:string) {
    //TODO: maybe move to enum or const
    if (this.state_ != "death") {
      this.state_ = s;
    }
  }

  FindNear(radius:number, includeSelf:boolean = false) {
    let nearby = this.grid_
        .FindNear([this.position_[0], this.position_[2]], [radius, radius])
        //TODO: need to think about it
        .map((c) => c.entity);

    if (!includeSelf) {
      const _Filter = (e:any) => {
        return e.ID != this.ID;
      };
      nearby = nearby.filter(_Filter);
    }
    return nearby;
  }

  Update(timeElapsed:number) {
    this.UpdateActions_(timeElapsed);
  }

  UpdateActions_(timeElapsed:number) {
    if (!this.action_) {
      // Hack, again, should move this all through events
      if (this.state_ == "attack") {
        this.SetState("idle");
      }
      return;
    }

    this.action_.Update(timeElapsed);
    if (this.action_.Finished) {
      this.action_ = null;
      this.SetState("idle");
    }
  }
}

class Action_Attack implements ActionAttackInterface {

  onAction_:onAction;
  time_:number;
  cooldown_:number;
  timeElapsed_:number;

  constructor(time:number, cooldown:number, onAction: onAction) {
    this.onAction_ = onAction;
    this.time_ = time;
    this.cooldown_ = cooldown;
    this.timeElapsed_ = 0.0;
  }

  get Finished() {
    return this.timeElapsed_ > this.cooldown_;
  }

  Update(timeElapsed:number) {
    const oldTimeElapsed = this.timeElapsed_;
    this.timeElapsed_ += timeElapsed;
    if (this.timeElapsed_ > this.time_ && oldTimeElapsed <= this.time_) {
      this.onAction_();
    }
  }
}
