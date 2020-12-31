export default interface Node {
    x: number;
    y: number;
    space: string;
    walkable: boolean;
    fCost: number;
    gCost: number;
    hCost: number;
    parent: Node | null;
}