export default class Vector {

    /**
     * 
     * @param startX - The starting x coordinate of the vector
     * @param startY - The starting y coordinate of the vector
     * @param endX - The ending x coordinate of the vector
     * @param endY - The ending y coordinate of the vector
     */
    constructor(
        public startX: number,
        public startY: number,
        public endX: number,
        public endY: number,
    ) { };

    /**
     * Gets the vector translated to the origin (0, 0)
     */
    public get normalized(): Vector {
        const xOff = this.startX;
        const yOff = this.startY;

        return new Vector(0, 0, this.endX - xOff, this.endY - yOff);
    }

    /**
     * Gets the vectors magnitude using the distance formula
     */
    public get magnitude(): number {
        return Math.sqrt(Math.pow((this.startX - this.endX), 2) + Math.pow((this.startY - this.endY), 2));
    }

    /**
     * Scales the parent vector to the child vector
     * @param vector - The vector you would like to scale to
     * @example (new Vector(2, 4, 6, 8)).scale(new Vector(8, 10, 34, 56))
     * // This will allow you to scale the vector with the origin (2, 4)
     * // to the vector with the origin (8, 10)
     * 
     */
    public scale(vector: Vector): Vector {
        return new Vector(vector.startX, vector.startY, this.endX + vector.startX, this.endY + vector.startY);
    }

    /**
     * Increases the vectors magnitude based off the scalar.
     * It is recommended to normalize the vector before using a scalar
     * @param multiple - The scalar used
     */
    public scalar(multiple: number): Vector {
        return new Vector(this.startX, this.startY, this.endX * multiple, this.endY * multiple);
    }
    /**
     * Adds two vectors together
     * @param vector - The vector to add the parent to
     */
    public add(vector: Vector): Vector {
        const thisNormalized = this.normalized;
        const vectorNormalized = vector.normalized;

        const newVector = new Vector(0, 0, thisNormalized.endX + vectorNormalized.endX, thisNormalized.endY + vectorNormalized.endY);
        const scaledBack = newVector.scale(this);
        return scaledBack;
    }
}