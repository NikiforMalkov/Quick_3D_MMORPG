
import { Noise } from './noise';
import { terrain_constants } from './terrainConstants'


export class HeightGenerator {
    
    noise_:Noise;

    constructor() {
        this.noise_ = new Noise(terrain_constants.NOISE_PARAMS)
    }

    Get(x:number, y:number, z:number): number[] {
        return [this.noise_.Get(x, y, z), 1]
    }
}


