
import { Noise } from './noise.js';
import { terrain_constants } from './terrainConstants.js'


export class HeightGenerator {
    
    noise_:Noise;

    constructor() {
        this.noise_ = new Noise(terrain_constants.NOISE_PARAMS)
    }

    Get(x:number, y:number, z:number): number[] {
        return [this.noise_.Get(x, y, z), 1]
    }
}


