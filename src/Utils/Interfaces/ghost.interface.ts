export default interface Ghost {
    name: "pinky" | "inky" | "blinky" | "clyde";
    x: number;
    y: number;
    eatable: boolean;
    pieceOnType: "food" | "empty" | "powerPellet" | "cherry";
}