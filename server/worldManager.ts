import { CHARACTER_MODELS } from '../shared/defs';
import { HeightGenerator } from '../shared/terrainHeight';
import { SpatialHashGrid } from '../shared/spatialHashGrid';
import { quat, vec3 } from "gl-matrix";
import { SocketWrapperInterface, WorldServerInterface } from './worldServer';
import { WorldEntity } from './worldEntity';
import { WorldAIClient, WorldClientInterface, WorldNetworkClient } from './worldClient';

interface MonsetrSpawnerParams {
    parent: WorldManagerInterface
    pos: vec3
    class: string
}

class MonsterSpawner {

    parent_: WorldManagerInterface;
    grid_: SpatialHashGrid;
    terrain_: HeightGenerator;
    pos_: vec3;
    params_: MonsetrSpawnerParams;
    entity_: WorldClientInterface | null = null;

    constructor(params:MonsetrSpawnerParams) {
        this.parent_ = params.parent;
        this.grid_ = this.parent_.grid_;
        this.terrain_ = this.parent_.terrain_;
        this.pos_ = params.pos;
        this.pos_[1] = this.terrain_.Get(params.pos[0], params.pos[1], params.pos[2])[0];
        this.params_ = params;
    }

    Spawn_() {
        // TODO: remove hack
        // Hack
        const e = new WorldEntity({
            id: this.parent_.ids_++,
            position: vec3.clone(this.pos_),
            rotation: quat.fromValues(0, 0, 0, 1),
            grid: this.grid_,
            character: {
                definition: CHARACTER_MODELS[this.params_.class as keyof typeof CHARACTER_MODELS],
                class: this.params_.class,
            },
            account: {
                accountName: CHARACTER_MODELS[this.params_.class as keyof typeof CHARACTER_MODELS].name,
            },
        });

        const wc = new WorldAIClient(e, this.terrain_, () => {
            this.entity_ = null;
            console.log("entity gone, spawner making now one soon");
        });

        this.parent_.AddMonster(wc);

        this.entity_ = wc;
    }

    Update(timeElapsed:number) {
        if (!this.entity_) {
            this.Spawn_();
        }
    }
}

const _TICK_RATE = 0.1;

export interface WorldManagerInterface {
    ids_: number;
    grid_: SpatialHashGrid;
    terrain_: HeightGenerator;

    AddMonster(e:WorldClientInterface): void
    Add(client:SocketWrapperInterface, params:WorldManagerAddParams): void
    Update(timeElapsed:number): void
    TickClientState_(timeElapsed:number): void
    UpdateSpawners_(timeElapsed:number) : void
    UpdateEntities_(timeElapsed:number) : void
}

interface WorldManagerAddParams {
    accountName: string
}

export class WorldManager implements WorldManagerInterface {

    ids_:number;
    entities_:WorldClientInterface[];
    grid_: SpatialHashGrid;
    terrain_: HeightGenerator;
    spawners_;
    tickTimer_:number;

    constructor(parent: WorldServerInterface) {
        this.ids_ = 0;
        this.entities_ = [];
        this.grid_ = new SpatialHashGrid(
            [
                [-4000, -4000],
                [4000, 4000],
            ],
            [1000, 1000]
        );

        this.terrain_ = new HeightGenerator();

        this.spawners_ = [];
        this.tickTimer_ = 0.0;

        // TODO: remove the hack
        // Hack
        for (let x = -40; x <= 40; ++x) {
            for (let z = -40; z <= 40; ++z) {
                if (Math.random() < 0.1) {
                    const pos = vec3.fromValues(x * 75, 0, z * 75);
                    if (Math.random() < 0.1) {
                        this.spawners_.push(
                            new MonsterSpawner({
                                parent: this,
                                pos: pos,
                                //TODO: enum or something like that
                                class: "warrok",
                            })
                        );
                    } else {
                        this.spawners_.push(
                            new MonsterSpawner({
                                parent: this,
                                pos: pos,
                                //TODO: enum or something like that
                                class: "zombie",
                            })
                        );
                    }
                }
            }
        }
    }

    AddMonster(e:WorldClientInterface) {
        this.entities_.push(e);
    }

    Add(client:SocketWrapperInterface, params:WorldManagerAddParams) {
        const models = ["sorceror", "paladin"];
        const randomClass = models[Math.floor(Math.random() * models.length)];

        // Hack
        const e = new WorldEntity({
            id: this.ids_++,
            position: vec3.fromValues(
                -60 + (Math.random() * 2 - 1) * 20,
                0,
                (Math.random() * 2 - 1) * 20
            ),
            rotation: quat.fromValues(0, 0, 0, 1),
            grid: this.grid_,
            character: {
                definition: CHARACTER_MODELS[randomClass as keyof typeof CHARACTER_MODELS],
                class: randomClass,
            },
            account: params,
        });

        const wc = new WorldNetworkClient(client, e);

        this.entities_.push(wc);

        wc.BroadcastChat({
            name: "",
            server: true,
            text: "[" + params.accountName + " has entered the game]",
        });
    }

    Update(timeElapsed:number) {
        this.TickClientState_(timeElapsed);
        this.UpdateEntities_(timeElapsed);
        this.UpdateSpawners_(timeElapsed);
    }

    TickClientState_(timeElapsed:number) {
        this.tickTimer_ += timeElapsed;
        if (this.tickTimer_ < _TICK_RATE) {
            return;
        }

        this.tickTimer_ = 0.0;

        for (let i = 0; i < this.entities_.length; ++i) {
            this.entities_[i].UpdateClientState_();
        }
        for (let i = 0; i < this.entities_.length; ++i) {
            this.entities_[i].entity_!.events_ = [];
        }
    }

    UpdateSpawners_(timeElapsed:number) {
        for (let i = 0; i < this.spawners_.length; ++i) {
            this.spawners_[i].Update(timeElapsed);
        }
    }

    UpdateEntities_(timeElapsed:number) {
        const dead:WorldClientInterface[] = [];
        const alive:WorldClientInterface[] = [];

        for (let i = 0; i < this.entities_.length; ++i) {
            const e = this.entities_[i];

            e.Update(timeElapsed);

            if (e.IsDead) {
                console.log("killed it off");
                dead.push(e);
            } else {
                alive.push(e);
            }
        }

        this.entities_ = alive;

        for (let d of dead) {
            d.OnDeath();
            d.Destroy();
        }
    }
}
