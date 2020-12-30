import { stdin } from "process";
import { clone } from "ramda";
import GhostObject from "./Utils/Interfaces/ghost.object.interface";

export default class PacMan {
    
    #renderSpeed: number = 400;
    #gameCounter: number = 0;
    #score: number = 0;
    #eatenDots: number = 0;
    #cherryPlaced: boolean = false;

    #lives: number = 3;

    #level: string[][] = [];
    #currentLevel: number = 1;
    #interval: NodeJS.Timeout | false = false;

    #pacman: string = "🟡";
    #ghost: string = "👻";
    #cherry: string = "🍒";
    #food: string = "🔸";
    #powerPellet: string = "🟠";
    #wall: string = "🟥";
    #empty: string = "⚫";
    #door: string = "🟦";
    #border: string = "🔳";

    #ghostPositions: GhostObject[] = [{
        inky: {
            y: 13,
            x: 8,
            eatable: false,
            name: "inky",
            pieceOnType: "empty",
        },
        blinky: {
            y: 13,
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
            y: 11,
            eatable: false,
            name: "clyde",
            pieceOnType: "empty",
        }
    }];

    #pacmanPos: { x: number, y: number }[] = [
        { x: 9, y: 21, }, 
    ];

    #facing: "r" | "l" | "u" | "d" = "u";

    constructor() { 
        this.start() 
    };

    private start(): void {

        console.clear();

        const keypress = require("keypress");
        keypress(stdin);
        this.#level = this.createLevel();

        this.#interval = setInterval(async () => {
            await this.render();
        }, this.#renderSpeed);

        stdin.on("keypress", (__, key) => {
            if (key && key.ctrl && key.name === "c") process.exit(1);
            if (key && (key.name === "w" || key.name === "up")) this.#facing = "u";
            if (key && (key.name === "a" || key.name === "left")) this.#facing = "l";
            if (key && (key.name === "s" || key.name === "down")) this.#facing = "d";
            if (key && (key.name === "d" || key.name === "right")) this.#facing = "r";
            if (key && key.name === "p") this.pause_play();
        });

        stdin.setRawMode(true);
        stdin.resume();
    }

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

    private async render(): Promise<void> {
        const blinkyRender = 35;
        const inkyRender = 70;
        const pinkyRender = 105

        console.clear();

        this.move();

        await this.ghostMove("clyde");
        if (this.#gameCounter > blinkyRender) await this.ghostMove("blinky");
        if (this.#gameCounter > inkyRender) await this.ghostMove("inky");
        if (this.#gameCounter > pinkyRender) await this.ghostMove("pinky");

        if (this.#gameCounter === blinkyRender) {
            this.#ghostPositions[0]["blinky"].x = 9;
            this.#ghostPositions[0]["blinky"].y = 11;
        } else if (this.#gameCounter === inkyRender) {
            this.#ghostPositions[0]["inky"].x = 9;
            this.#ghostPositions[0]["inky"].y = 11;
        } else if (this.#gameCounter === pinkyRender) {
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
            this.scareGhosts();
            this.#eatenDots++;
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

        // Render Clyde
        if (oldGhostPositions) {
            const CpieceType = oldGhostPositions.clyde.pieceOnType;
            this.#level[newGhostPositions.clyde.y][newGhostPositions.clyde.x] = this.#ghost;
            this.#level[oldGhostPositions.clyde.y][oldGhostPositions.clyde.x] = CpieceType === "empty" ? this.#empty : CpieceType === "food" ? this.#food : CpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Blinky
        if (this.#gameCounter > blinkyRender) {
            const BpieceType = oldGhostPositions.blinky.pieceOnType;
            this.#level[newGhostPositions.blinky.y][newGhostPositions.blinky.x] = this.#ghost;
            this.#level[oldGhostPositions.blinky.y][oldGhostPositions.blinky.x] = BpieceType === "empty" ? this.#empty : BpieceType === "food" ? this.#food : BpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Inky
        if (this.#gameCounter > inkyRender) {
            const IpieceType = oldGhostPositions.inky.pieceOnType;
            this.#level[newGhostPositions.inky.y][newGhostPositions.inky.x] = this.#ghost;
            this.#level[oldGhostPositions.inky.y][oldGhostPositions.inky.x] = IpieceType === "empty" ? this.#empty : IpieceType === "food" ? this.#food : IpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }

        // Render Pinky
        if (this.#gameCounter > pinkyRender) {
            const PpieceType = oldGhostPositions.pinky.pieceOnType;
            this.#level[newGhostPositions.pinky.y][newGhostPositions.pinky.x] = this.#ghost;
            this.#level[oldGhostPositions.pinky.y][oldGhostPositions.pinky.x] = PpieceType === "empty" ? this.#empty : PpieceType === "food" ? this.#food : PpieceType === "cherry" ? this.#cherry : this.#powerPellet;
        }


        this.info();
    }

    private async ghostMove(ghost: "clyde" | "inky" | "pinky" | "blinky"): Promise<void> {
        let newPos = clone(this.#ghostPositions[0]);
        let oldPos = clone(this.#ghostPositions[0]);

        const move = (): void => {
            const math = Math.floor(Math.random() * 4) + 1;
            if (math === 1) {
                newPos[ghost].x++;
            } else if (math === 2) {
                newPos[ghost].x--;
            } else if (math === 3) {
                newPos[ghost].y++;
            } else if (math === 4) {
                newPos[ghost].y--;
            }

            if (newPos[ghost].x > 18) newPos[ghost].x = 0;
            if (newPos[ghost].x < 0) newPos[ghost].x = 18;

            if (this.#level[newPos[ghost].y][newPos[ghost].x] === this.#wall || this.#level[newPos[ghost].y][newPos[ghost].x] === this.#door) {
                newPos = clone(this.#ghostPositions[0]);
                return move();
            }

            if (newPos[ghost].x === oldPos[ghost].x && newPos[ghost].y === oldPos[ghost].y) {
                newPos = clone(this.#ghostPositions[0]);
                move();
            }

            const boardPart = this.#level[newPos[ghost].y][newPos[ghost].x];
            newPos[ghost].pieceOnType = boardPart === this.#food ? "food" : boardPart === this.#empty ? "empty" : boardPart === this.#cherry ? "cherry" : "powerPellet";

        }
        move();

        this.#ghostPositions[0][ghost] = newPos[ghost];
        if (this.#ghostPositions[1]) this.#ghostPositions[1][ghost] = oldPos[ghost];
        else this.#ghostPositions[1] = oldPos;
    }

    private win(): void {

    }

    private scareGhosts(): void {

        this.#ghostPositions[0]["blinky"].eatable = true;
        this.#ghostPositions[0]["clyde"].eatable = true;
        this.#ghostPositions[0]["inky"].eatable = true;
        this.#ghostPositions[0]["pinky"].eatable = true;

        setTimeout(() => {
            this.#ghostPositions[0]["blinky"].eatable = false;
            this.#ghostPositions[0]["clyde"].eatable = false;
            this.#ghostPositions[0]["inky"].eatable = false;
            this.#ghostPositions[0]["pinky"].eatable = false;
        }, 7500);
    }

    private move(): void {
        const oldArray = clone(this.#pacmanPos);
        const newPos = clone(this.#pacmanPos[0]);
        const oldPos = clone(this.#pacmanPos[0]);

        switch(this.#facing) {
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
    }
}