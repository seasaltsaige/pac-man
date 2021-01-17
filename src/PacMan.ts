import { stdin } from "process";
import { clone } from "ramda";
import GhostObject from "./Utils/Interfaces/ghost.object.interface";
import Vector from "./Utils/Vector/Vector";
export default class PacMan {

    #renderSpeed: number = 50;
    #gameCounter: number = 0;
    #score: number = 0;
    #eatenDots: number = 0;
    #cherryPlaced: boolean = false;

    #lives: number = 3;

    #level: string[][] = [];
    #currentLevel: number = 1;
    #interval: NodeJS.Timeout | false = false;

    // Game information. Emojis to use for the game
    #pacman: string = "🟡";
    #ghost: string = "👻";
    #cherry: string = "🍒";
    #food: string = "🔸";
    #powerPellet: string = "🟠";
    #wall: string = "🔳";
    #empty: string = "⚫";
    #door: string = "🟦";
    #border: string = "🔲";

    // Scatter mode moves each ghost into its respective corner
    // Chase move uses their normal targeting
    // Scared mode makes them choose random tiles to move to, still
    // not allowing them to move backwards.
    #mode: "scatter" | "chase" | "scared" = "chase";

    // Not the best stratagy, but the first element of this array
    // is the ghosts current status and the second element is where
    // the ghosts were previously. I do this so I can replace the last tile
    // they were on with the correct material.
    #ghostPositions: GhostObject[] = [{
        inky: {
            y: 13,
            x: 8,
            eatable: false,
            name: "inky",
            pieceOnType: "empty",
        },
        blinky: {
            y: 11,
            x: 9,
            eatable: false,
            name: "blinky",
            pieceOnType: "empty",
        },
        pinky: {
            y: 13,
            x: 10,
            eatable: false,
            name: "pinky",
            pieceOnType: "empty",
        },
        clyde: {
            x: 9,
            y: 13,
            eatable: false,
            name: "clyde",
            pieceOnType: "empty",
        }
    }];

    // Same idea as above, just with pacman
    #pacmanPos: { x: number, y: number }[] = [
        { x: 9, y: 21, },
    ];

    // Dirrection pacman is facing to determine which way he should move
    #facing: "r" | "l" | "u" | "d" = "u";

    constructor() {
        this.start()
    };

    private start(): void {

        console.clear();

        const keypress = require("keypress");
        keypress(stdin);
        this.#level = this.createLevel();

        this.#interval = setInterval(() => {
            this.render();
        }, this.#renderSpeed);

        stdin.on("keypress", (__, key) => {
            if (key && key.ctrl && key.name === "c") process.exit(1);
            if (key && (key.name === "w" || key.name === "up")) this.#facing = "u";
            if (key && (key.name === "a" || key.name === "left")) this.#facing = "l";
            if (key && (key.name === "s" || key.name === "down")) this.#facing = "d";
            if (key && (key.name === "d" || key.name === "right")) this.#facing = "r";
            if (key && key.name === "p") this.pause_play();
            if (key && key.name === "q") this.render();
        });

        stdin.setRawMode(true);
        stdin.resume();
    }

    // All this does is clear the current interval and reset it
    // so you can "pause" the game. As no rendering is taking place
    private pause_play(): void {
        if (this.#interval !== false) {
            clearInterval(this.#interval);
            this.#interval = false;
        } else {
            this.#interval = setInterval(() => {
                this.render();
            }, this.#renderSpeed);
        }
    }

    private render(): void {
        const blinkyRender = 2; // food eaten
        const pinkyRender = 5; // food eaten

        const clydeRender = 60; // food eaten
        const inkyRender = 29; // food eaten

        console.clear();

        if (this.#gameCounter % 8 === 0) this.move();

        if (this.#eatenDots > blinkyRender && this.#gameCounter % 10 === 0) this.ghostMove("blinky");
        if (this.#eatenDots > pinkyRender && this.#gameCounter % 10 === 0) this.ghostMove("pinky");
        if (this.#eatenDots > inkyRender && this.#gameCounter % 10 === 0) this.ghostMove("inky");
        if (this.#eatenDots > clydeRender && this.#gameCounter % 10 === 0) this.ghostMove("clyde");

        if (this.#eatenDots === inkyRender) {
            this.#ghostPositions[0]["inky"].x = 9;
            this.#ghostPositions[0]["inky"].y = 11;
        }
        if (this.#eatenDots === clydeRender) {
            this.#ghostPositions[0]["clyde"].x = 9;
            this.#ghostPositions[0]["clyde"].y = 11;
        }
        if (this.#gameCounter === pinkyRender) {
            this.#ghostPositions[0]["pinky"].x = 9;
            this.#ghostPositions[0]["pinky"].y = 11;
        }

        this.#gameCounter++;

        if (this.#eatenDots === 179) this.win();

        if (this.#level[this.#pacmanPos[0].y][this.#pacmanPos[0].x] === this.#food) {
            this.#score += 10;
            this.#eatenDots++;
            if (this.#cherryPlaced === true) this.#cherryPlaced = false;
        } else if (this.#level[this.#pacmanPos[0].y][this.#pacmanPos[0].x] === this.#powerPellet) {
            this.#score += 50;
            this.#eatenDots++;
            this.scareGhosts();
        } else if (this.#level[this.#pacmanPos[0].y][this.#pacmanPos[0].x] === this.#cherry) {
            this.#score += 100;
        }
        // 179 total dots
        if (this.#eatenDots === 70 || this.#eatenDots === 140) this.#level[15][9] = this.#cherry;

        // Pacman Rendering
        this.#level[this.#pacmanPos[0].y][this.#pacmanPos[0].x] = this.#pacman;
        if (this.#pacmanPos[1]) this.#level[this.#pacmanPos[1].y][this.#pacmanPos[1].x] = this.#empty;

        // Ghost Rendering
        const newGhostPositions = this.#ghostPositions[0];
        const oldGhostPositions = this.#ghostPositions[1];

        // Render Blinky
        if (this.#eatenDots > blinkyRender && oldGhostPositions) {
            const CpieceType = oldGhostPositions.blinky.pieceOnType;
            this.#level[newGhostPositions.blinky.y][newGhostPositions.blinky.x] = this.#ghost;
            this.#level[oldGhostPositions.blinky.y][oldGhostPositions.blinky.x] = CpieceType === "empty" ? this.#empty : CpieceType === "food" ? this.#food : CpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Inky
        if (this.#eatenDots > inkyRender) {
            const BpieceType = oldGhostPositions.blinky.pieceOnType;
            this.#level[newGhostPositions.inky.y][newGhostPositions.inky.x] = this.#ghost;
            this.#level[oldGhostPositions.inky.y][oldGhostPositions.inky.x] = BpieceType === "empty" ? this.#empty : BpieceType === "food" ? this.#food : BpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Clyde
        if (this.#eatenDots > clydeRender) {
            const IpieceType = oldGhostPositions.clyde.pieceOnType;
            this.#level[newGhostPositions.clyde.y][newGhostPositions.clyde.x] = this.#ghost;
            this.#level[oldGhostPositions.clyde.y][oldGhostPositions.clyde.x] = IpieceType === "empty" ? this.#empty : IpieceType === "food" ? this.#food : IpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Pinky
        if (this.#eatenDots > pinkyRender) {
            const PpieceType = oldGhostPositions.pinky.pieceOnType;
            this.#level[newGhostPositions.pinky.y][newGhostPositions.pinky.x] = this.#ghost;
            this.#level[oldGhostPositions.pinky.y][oldGhostPositions.pinky.x] = PpieceType === "empty" ? this.#empty : PpieceType === "food" ? this.#food : PpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }


        this.info();
    }

    private ghostMove(ghost: "clyde" | "inky" | "pinky" | "blinky"): void {

        let newPos = clone(this.#ghostPositions[0]);
        let oldPos = clone(this.#ghostPositions[0]);

        if (ghost === "blinky") {

            // Blinky's target tile is the same tile that PacMan is on each "frame"
            const bestMove = this.getBestMove(this.#pacmanPos[0], ghost, oldPos);

            // Setting the new ghosts position to the new move that gets said ghost closest to PacMan.
            newPos[ghost].x = bestMove.x;
            newPos[ghost].y = bestMove.y;

        } else if (ghost === "pinky") {

            // Calculate Pinky's target tile based on PacMans position and the dirrection he is facing
            const targetTile = {
                x: this.#pacmanPos[0].x + (this.#facing === "l" ? -2 : this.#facing === "r" ? 2 : 0),
                y: this.#pacmanPos[0].y + (this.#facing === "u" ? -2 : this.#facing === "d" ? 2 : 0),
            }

            // The below logic will be exactly the same as Blinky, as Pinky just has a different
            // target tile. Other than that, she behaves exactly the same.

            const bestMove = this.getBestMove(targetTile, ghost, oldPos);

            newPos[ghost].x = bestMove.x;
            newPos[ghost].y = bestMove.y;

        } else if (ghost === "inky") {

            // Inky's movement calculations are a bit odd, but we can create a hacky version of
            // 2D vectors and use those to calculate Inky's target tile. Inky's calculations also take into
            // account where Blinky currently is, and Pinky's tile that she is targeting.

            // Calculate Pinky's target tile based on PacMans position and the dirrection he is facing
            // This position is used in Inky's tile calculations
            const pinkTarget = {
                x: this.#pacmanPos[0].x + (this.#facing === "l" ? -2 : this.#facing === "r" ? 2 : 0),
                y: this.#pacmanPos[0].y + (this.#facing === "u" ? -2 : this.#facing === "d" ? 2 : 0),
            }
            // Store Blinky's current x and y position for later use. Again, this is used in Inky's
            // calculations
            const blinkyPos = { x: oldPos["blinky"].x, y: oldPos["blinky"].y };

            // Creating a pseudo vector from blinkys current position to pinkys target tile
            const vector = new Vector(blinkyPos.x, blinkyPos.y, pinkTarget.x, pinkTarget.y);
            // Normalizing the vector to start at (0, 0)
            // This basically just translates the entire thing over by the starting position
            const normalized = vector.normalized;

            // Doubling the vectors magnitude
            // Multiplies the endX and endY by 2
            const doubled = normalized.scalar(2);
            // Scale the vector back up into the previous starting position
            // This adds the old vectors start position back to the doubled vector.
            // This allows the vector to be correctly doubled without distortions.
            const reScaled = doubled.scale(vector);
            // Taking the final position that Inky should target
            const { endX, endY } = reScaled;

            const bestMove = this.getBestMove({ x: endX, y: endY }, ghost, oldPos);
            newPos[ghost].x = bestMove.x;
            newPos[ghost].y = bestMove.y;

        } else if (ghost === "clyde") {
            // Calculate the distance clyde is from PacMan, this is used to determine
            // which "mode" clyde should be in. If he is closer than 8 tiles, he will
            // "run away" towards the bottom left of the map. If he is farther than 8
            // tiles, he will act identically to Blinky.
            const currentDistToPacMan = Math.sqrt(Math.pow((oldPos[ghost].x - this.#pacmanPos[0].x), 2) + Math.pow((oldPos[ghost].y - this.#pacmanPos[0].y), 2));

            if (currentDistToPacMan <= 8) {
                // This is where Clyde will start targeting a tile outside of the bottom left of the level map

                // First we can define the actual point that Clyde will want to escape to.
                // I'm going to put it outside of the map, firstly because then Clyde will never
                // Actually be able to GET to the point, and secondly, because that's how it's
                // Actually done in the game.
                const runAwayPoint = { x: 1, y: 27 };

                const bestMove = this.getBestMove(runAwayPoint, ghost, oldPos);
                newPos[ghost].x = bestMove.x;
                newPos[ghost].y = bestMove.y;
            } else {
                // This is where Clyde will act identical to Blinky
                const bestMove = this.getBestMove(this.#pacmanPos[0], ghost, oldPos);
                newPos[ghost].x = bestMove.x;
                newPos[ghost].y = bestMove.y;
            }
        }


        const boardPart = this.#level[newPos[ghost].y][newPos[ghost].x];
        newPos[ghost].pieceOnType = boardPart === this.#food ? "food" : boardPart === this.#empty ? "empty" : boardPart === this.#cherry ? "cherry" : boardPart === this.#powerPellet ? "powerPellet" : "empty";

        this.#ghostPositions[0][ghost] = newPos[ghost];
        if (this.#ghostPositions[1]) this.#ghostPositions[1][ghost] = oldPos[ghost];
        else this.#ghostPositions[1] = oldPos;
    }

    private getBestMove(target: { x: number, y: number }, ghost: "clyde" | "inky" | "pinky" | "blinky", oldPos: GhostObject) {

        // An array of all the different movement options for the ghost before taking into consideration of where
        // the walls are and where the ghost was previously.
        const moveOptions = [
            { x: oldPos[ghost].x + 1, y: oldPos[ghost].y },
            { x: oldPos[ghost].x, y: oldPos[ghost].y + 1 },
            { x: oldPos[ghost].x - 1, y: oldPos[ghost].y },
            { x: oldPos[ghost].x, y: oldPos[ghost].y - 1 }
        ];

        // Completely temporary
        if (this.#mode === "scatter") {
            switch (ghost) {
                case "blinky":
                    target = { x: 18, y: -2 };
                    break;
                case "clyde":
                    target = { x: 1, y: 27 };
                    break;
                case "inky":
                    target = { x: 19, y: 27 };
                    break;
                case "pinky":
                    target = { x: -1, y: -2 };
                    break;
            }
        } else if (this.#mode === "scared") {



        }

        // Set the x and y values to crazy high numbers because otherwise it wouldn't choose a new spot to go too.
        // x and y can be anything as long as they are larger than the actual board space.
        let bestMove: { x: number, y: number } = { x: 1000, y: 1000 };
        // Stupid distance formula                               x values                              y values
        let distanceToPacMan: number = Math.sqrt(Math.pow((target.x - bestMove.x), 2) + Math.pow((target.y - bestMove.y), 2));

        for (const moveOption of moveOptions) {
            // If the move option is eqal to the last spot the ghost was in, skip it
            if ((this.#ghostPositions[1] !== undefined)
                && (moveOption.x === this.#ghostPositions[1][ghost].x)
                && (moveOption.y === this.#ghostPositions[1][ghost].y))
                continue;

            // If the move option moves the ghost into a wall, skip it
            if ((this.#level[moveOption.y][moveOption.x] === this.#wall)
                || (this.#level[moveOption.y][moveOption.x] === this.#door)
                || (this.#level[moveOption.y][moveOption.x] === this.#border))
                continue;

            // New distance to pacman
            const distance = Math.sqrt(Math.pow((target.x - moveOption.x), 2) + Math.pow((target.y - moveOption.y), 2));

            // If the new calculated distance is closer to PacMan than the last calculated distance,
            // set the distance to the new distance and set the best move to the corresponding move.
            if (distance < distanceToPacMan) {
                distanceToPacMan = distance;
                bestMove = moveOption;
            }
        }

        // If the ghost is trying to move through either of the corridors,
        // teleport it to the other side of the map.
        if (bestMove.x > 18)
            bestMove.x = 0;
        else if (bestMove.x < 0)
            bestMove.x = 18;

        // If the ghost is trying to move onto another ghost
        // move said ghost back to where it was. I may remove this
        // but its just to prevent them from clipping with each other
        if (this.#level[bestMove.x][bestMove.y] === this.#ghost) {
            bestMove.x = oldPos[ghost].x;
            bestMove.y = oldPos[ghost].y;
        }

        return { x: bestMove.x, y: bestMove.y };

    }

    private win(): void {

    }

    private scareGhosts(): void {

        this.#ghostPositions[0]["blinky"].eatable = true;
        this.#ghostPositions[0]["clyde"].eatable = true;
        this.#ghostPositions[0]["inky"].eatable = true;
        this.#ghostPositions[0]["pinky"].eatable = true;
        this.#mode = "scared";

        setTimeout(() => {
            this.#ghostPositions[0]["blinky"].eatable = false;
            this.#ghostPositions[0]["clyde"].eatable = false;
            this.#ghostPositions[0]["inky"].eatable = false;
            this.#ghostPositions[0]["pinky"].eatable = false;
            this.#mode = "chase";
        }, 9000);
    }

    private move(): void {
        const oldArray = clone(this.#pacmanPos);
        const newPos = clone(this.#pacmanPos[0]);
        const oldPos = clone(this.#pacmanPos[0]);

        switch (this.#facing) {
            case "d":
                newPos.y++;
                break;
            case "u":
                newPos.y--;
                break;
            case "l":
                newPos.x--;
                break;
            case "r":
                newPos.x++;
                break;
        }

        if (this.#level[newPos.y][newPos.x] === this.#wall) {
            this.#pacmanPos = oldArray;
        } else {
            if (newPos.x > 18) newPos.x = 0;
            else if (newPos.x < 0) newPos.x = 18;
            this.#pacmanPos = [newPos, oldPos];
        }
    }

    private createLevel(): string[][] {

        // Shut up, i have no better way of doing this
        // Later me - I might have an idea but it might suck :D
        const row_zero = [this.#wall, this.#wall, this.#wall, this.#wall, this.#wall, this.#wall, this.#wall, this.#wall, this.#wall, this.#wall].mirrorConcat();
        const row_one = ([this.#wall].concat(...(this.#food.repeat(8))).concat(...[this.#wall]).mirrorConcat());
        const row_two = ([this.#wall, this.#food, this.#wall, this.#wall, this.#food, this.#wall, this.#wall, this.#wall, this.#food, this.#wall]).mirrorConcat();
        const row_three = ([this.#wall, this.#powerPellet, this.#wall, this.#wall, this.#food, this.#wall, this.#wall, this.#wall, this.#food, this.#wall]).mirrorConcat();
        const row_four = [...row_two];
        const row_five = ([this.#wall].concat(...(this.#food.repeat(9)))).mirrorConcat();
        const row_six = ([this.#wall].concat(...this.#food).concat(...(this.#wall.repeat(2))).concat(...(this.#food)).concat(...(this.#wall)).concat(...(this.#food)).concat(...(this.#wall.repeat(3)))).mirrorConcat();
        const row_seven = [...row_six];
        const row_eight = ([this.#wall].concat(...this.#food.repeat(4)).concat(...this.#wall).concat(...this.#food.repeat(3)).concat(...this.#wall)).mirrorConcat();
        const row_nine = [""].concat(...this.#wall.repeat(4).concat(...this.#food).concat(...this.#wall.repeat(3).concat(...this.#food).concat(...this.#wall))).mirrorConcat();
        const row_ten = ([...this.#empty.repeat(3)].concat(...this.#wall).concat(...this.#food).concat(...this.#wall.repeat(3)).concat(...this.#food).concat(this.#wall)).mirrorConcat();
        const row_eleven = ([...this.#empty.repeat(3)].concat(...this.#wall).concat(...this.#food).concat(...this.#wall).concat(...this.#empty.repeat(4))).mirrorConcat();
        const row_twelve = ([""].concat(...this.#wall.repeat(4)).concat(...this.#food).concat(...this.#wall).concat(...this.#empty).concat(...this.#wall.repeat(2)).concat(...this.#door)).mirrorConcat();
        const middle = ([...this.#empty.repeat(4)].concat(...this.#food).concat(...this.#empty.repeat(2)).concat(...this.#wall).concat(...this.#empty.repeat(2))).mirrorConcat();

        row_twelve.splice(0, 1);
        row_nine.splice(0, 1);

        const level_one: string[][] = [
            row_zero, row_one, row_two, row_three,
            row_four, row_five, row_six, row_seven,
            row_eight, row_nine, row_ten, row_eleven,
            row_twelve
        ];

        const return_level = [...clone(level_one), middle, ...(clone(level_one).reverse())];

        const ghostPos = this.#ghostPositions;

        return_level[ghostPos[0].clyde.y][ghostPos[0].clyde.x] = this.#ghost; // Clyde
        return_level[ghostPos[0].inky.y][ghostPos[0].inky.x] = this.#ghost; // Inky
        return_level[ghostPos[0].blinky.y][ghostPos[0].blinky.x] = this.#ghost; // Blinky
        return_level[ghostPos[0].pinky.y][ghostPos[0].pinky.x] = this.#ghost; // Pinky

        return_level[14][9] = this.#wall;
        return_level[this.#pacmanPos[0].y][this.#pacmanPos[0].x] = this.#pacman;

        return return_level;
    }

    private info(): void {
        console.log(`Current Score: ${this.#score} | Eaten Dots: ${this.#eatenDots}\n`);
        console.log(
            this.#border.repeat(21) + "\n" +
            this.#level.map(p => this.#border + p.join("") + this.#border).join(`\n`) + "\n" +
            this.#border.repeat(21)
        );
        console.log(`Extra Lives: ${this.#pacman.repeat(this.#lives - 1)}`);
    }
}