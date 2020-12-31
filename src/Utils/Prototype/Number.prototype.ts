interface Number {
    clamp(min: number, max: number): number;
};

Number.prototype.clamp = function (this: number, min: number, max: number): number {
    return Math.min(Math.max(this, min), max);
}