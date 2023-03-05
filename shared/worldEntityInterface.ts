import { quat, vec3 } from "gl-matrix";
import { SpatialHashGrid, SpatialHashGridClient } from "./spatialHashGrid";

export interface onAction {
    (): void;
}

export interface DescriptionInterface {
    account: {
        name: any
    }
    character: {
        class: any;
        inventory: any;
    }
}

export interface ActionAttackInterface  {
    onAction_:onAction;
    time_:number;
    cooldown_:number;
    timeElapsed_:number;

    get Finished():boolean
    Update(timeElapsed:number):void
}

export interface transformInterface {
    state : any;
    position : number[];
    rotation : number[];
}

export interface PlayerPacket {
    id: number
    desc: DescriptionInterface
    transform: (string | number[])[]
}


export interface WorldEntityInterface {
    position_:vec3
    rotation_:quat
    action_: ActionAttackInterface | null
    accountInfo_:AccountInfoInterface
    state_:string
    parent_:any
    isAI: boolean;
    onEvent_:any;

    Destroy(): void
    get ID(): number
    get Valid(): boolean
    get Health(): number
    GetDescription(): DescriptionInterface
    CreatePlayerPacket_(): PlayerPacket
    CreateStatsPacket_(): (number | StatsInterface)[]
    CreateEventsPacket_(): any[]
    CreateTransformPacket_():(string | number[])[]
    UpdateTransform(transformData:transformInterface): void
    UpdateGridClient_(): void
    UpdateInventory(inventory:any): void
    OnActionAttack(): void
    OnActionAttack_Fired(): void
    OnDamage(attacker:WorldEntityInterface, damage:number): void
    SetState(s:string): void
    FindNear(radius:number, includeSelf:boolean): (WorldEntityInterface | undefined)[]
    FindNear(radius:number): (WorldEntityInterface | undefined)[]
    Update(timeElapsed:number): void
    UpdateActions_(timeElapsed:number): void
}

export interface AccountInfoInterface {
    name: string
}

export interface WorldEntityParams {
    id:number
    account: {
        accountName: string
    }
    position:vec3
    rotation: quat
    character: {
        class: string
        definition: any
    }
    grid: SpatialHashGrid
}

export interface StatsInterface {
    health: number,
    maxHealth: number,
    strength: number,
    wisdomness: number,
    benchpress: number,
    curl: number,
    experience: number,
    level: number
}

