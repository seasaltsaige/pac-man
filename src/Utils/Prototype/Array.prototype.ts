interface Array<T> {
    /**
    * Creates a new array of the original array concated with the reversed version of itself
    */
    mirrorConcat(): Array<T>;
}

Array.prototype.mirrorConcat = function<T>(): Array<T> {
    const original_array = [...this];
    this.reverse();
    return this[0] === " " ? original_array.concat(...this.slice(2, this.length)) : original_array.concat(...this.slice(1, this.length));
}