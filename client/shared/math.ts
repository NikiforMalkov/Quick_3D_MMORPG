
function rand_range (a:number, b:number) {
    return Math.random() * (b - a) + a
}
  
function rand_normalish() {
    const r = Math.random() + Math.random() + Math.random() + Math.random()
    return (r / 4.0) * 2.0 - 1
}

function rand_int (a:number, b:number) {
    return Math.round(Math.random() * (b - a) + a)
}

function lerp(x:number, a:number, b:number) {
    return x * (b - a) + a
}

function smoothstep(x:number, a:number, b:number) {
    x = x * x * (3.0 - 2.0 * x)
    return x * (b - a) + a
}

function smootherstep(x:number, a:number, b:number) {
    x = x * x * x * (x * (x * 6 - 15) + 10)
    return x * (b - a) + a
}

function clamp(x:number, a:number, b:number) {
    return Math.min(Math.max(x, a), b)
}

function sat (x:number) {
    return Math.min(Math.max(x, 0.0), 1.0)
}

const in_range = (x:number, a:number, b:number) => {
    return x >= a && x <= b
}

export {sat, in_range, clamp, smootherstep, lerp, smoothstep, rand_int, rand_normalish, rand_range}  