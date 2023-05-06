"use strict";

const FADDER_GROUPS = [
    // Mapp, antal filer (1.png-N.png) i mappen.
    ["fjadrande", 5],
    ["fohsare", 9],
    ["gamlingar", 4]
];
const FADDER_IMAGES = new Map(
    FADDER_GROUPS.map(spec => [
        spec[0],
        new Array(spec[1]).fill(0).map(
            (_, i) => Resource.addAsset(`img/faddrar/${spec[0]}/${i+1}.png`)
        )
    ])    
);

class Block extends GameObject {
    static get scale() { return 0.05; }

    /**
     * @param {Level} level 
     */
    constructor(row, column, level, image) {
        super(0, 0, image, /*angle=*/null, /*scale=*/null, /*register=*/false);
        this._row = row;
        this.column = column;
        this.level = level;
        this.baseScale = this.scale;
        Controller.instance.registerObject(this, this.layer);
    }

    get layer() {
        return 1 + this.level.numRows - this._row;
    }

    get row() {
        return this._row;
    }

    set row(value) {
        if (value === this._row)
            return;
        const oldLayer = this.layer;
        this._row = value;
        Controller.instance.changeLayer(this, oldLayer, this.layer);
    }

    rescale() {
        this.scale = this.baseScale * this.level.getScale(this.row);
    }

    draw(gameArea) {
        if (!this.level.isInMap(this.row, this.column))
            return;
        [this.x, this.y] = this.level.positions[this.row][this.column];
        this.rescale();
        super.draw(gameArea);
    }
}

function addToPositionArray(arr, rowDelta, columnDelta) {
    return arr.map(pos => [pos[0] + rowDelta, pos[1] + columnDelta]);
}

function rotateArrayAround(arr, rowPivot, columnPivot, clockwise) {
    if (clockwise) {
        return arr.map(pos => [
            rowPivot - (pos[1] - columnPivot),
            columnPivot + pos[0] - rowPivot
        ]);
    } else {
        return arr.map(pos => [
            rowPivot + pos[1] - columnPivot,
            columnPivot - (pos[0] - rowPivot)
        ]);
    }
}

/**
 * https://en.wikipedia.org/wiki/Tetromino#One-sided_tetrominoes
 */
class Shape extends GameObject {
    /**
     * Array of [row, column] coordinates relative to the shape's origin.
     */
    static get blockCoords() {
        throw new Error('Not implemented in base class');
    }
    /**
     * Array of [row, column] coordinates relative to the shape's origin.
     */
    pivotPoints() {
        throw new Error('Not implemented in base class');
    }

    /**
     * @param {Number} row
     * @param {Number} column
     * @param {Level} level 
     * @param {function} onSettle
     * @param {function} onCannotCreate
     */
    constructor(row, column, level, onSettle, onCannotCreate) {
        super(0, 0);
        this.blockCoordsRelative = this.constructor.blockCoords;
        this.rotation = 0;
        this.row = row;
        this.column = column;
        this.level = level;
        this.onSettle = onSettle;

        const blockCoords = this.getBlockCoords();
        // console.log(`Spawning ${this.constructor.name} at ${this.row}-${this.column}`);
        // console.log('Block coordinates:', JSON.stringify(blockCoords));

        if (!this.allFree(blockCoords)) {
            onCannotCreate();
            return;
        }
        const [group, numImages] = FADDER_GROUPS[Math.floor(Math.random() * FADDER_GROUPS.length)];
        const imageIndices = new Array(numImages).fill(0).map((_, i) => i);
        this.blocks = blockCoords.map(
            pos => {
                const imageIndex = imageIndices.length > 1 ? imageIndices.splice(Math.floor(Math.random() * imageIndices.length), 1)[0] : imageIndices[0];

                return new Block(
                    pos[0],
                    pos[1],
                    this.level,
                    Resource.getAsset(FADDER_IMAGES.get(group)[imageIndex]),
                );
            }
        );
    }
    
    allFree(blockCoords) {
        return blockCoords.every(
            pos => this.level.isFree(pos[0], pos[1])
        );
    }

    setBlockCoords(blockCoords) {
        if (blockCoords.length !== this.blocks.length)
            throw new Error(`Wrong length of block coords: ${blockCoords.length} elements (expected ${this.blocks.length})`)
        for (let i = 0; i < blockCoords.length; i++) {
            [this.blocks[i].row, this.blocks[i].column] = blockCoords[i];
        }
    }

    getBlockCoords() {
        return addToPositionArray(
            this.blockCoordsRelative, this.row, this.column
        );
    }

    _move(columnDelta) {
        const newCoords = addToPositionArray(
            this.blockCoordsRelative, this.row, this.column + columnDelta
        );
        if (!this.allFree(newCoords))
            return;
        this.column += columnDelta;
        this.setBlockCoords(newCoords);
    }
    
    moveLeft() {
        // console.log('Moving to the left');
        this._move(-1);
    }
    moveRight() {
        // console.log('Moving to the right');
        this._move(1);
    }

    fall(toBottom = false) {
        // console.log('Falling', toBottom ? 'to bottom' : '1 row');
        let potentialNewCoords = addToPositionArray(
            this.blockCoordsRelative, this.row - 1, this.column);
        if (toBottom) {
            let newCoords = null;
            while (this.allFree(potentialNewCoords)) {
                newCoords = potentialNewCoords;
                this.row -= 1;
                potentialNewCoords = addToPositionArray(newCoords, -1, 0);
            }
            this.setBlockCoords(newCoords);
            this.onSettle(this);
        } else if (this.allFree(potentialNewCoords)) {
            this.row -= 1;
            this.setBlockCoords(potentialNewCoords);
        } else {
            this.onSettle(this);
        }
    }

    _rotate(clockwise) {
        const num_directions = 4;
        const offsets = [[0, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [rowOffset, columnOffset] of offsets) {
            for (const [rowPivot, columnPivot] of this.pivotPoints(this.rotation)) {
                const newCoordsRelative = rotateArrayAround(
                    this.blockCoordsRelative,
                    rowPivot,
                    columnPivot,
                    clockwise
                );
                const newCoords = addToPositionArray(
                    newCoordsRelative,
                    this.row + rowOffset,
                    this.column + columnOffset
                );

                if (this.allFree(newCoords)) {
                    this.blockCoordsRelative = newCoordsRelative;
                    this.rotation = (
                        this.rotation + (clockwise ? 1 : num_directions - 1)
                    ) % num_directions;
                    this.setBlockCoords(newCoords);
                    this.row += rowOffset;
                    this.column += columnOffset;
                    return true;
                }
            }
        }
        return false;
    }

    rotateLeft() { return this._rotate(false); }
    rotateRight() { return this._rotate(true); }
    
    // Blocks handle their own drawing
    draw(gameArea) {}
}

class ShapeI extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [0, 2]];
    }
    pivotPoints() {
        return [[0.5, 0.5]];
    }
}

class ShapeO extends Shape {
    static get blockCoords() {
        return [[0, 0], [0, 1], [-1, 0], [-1, 1]];
    }
    pivotPoints() {
        return [[-0.5, 0.5]];
    }
}

class ShapeT extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, 0]];
    }
    pivotPoints() {
        return [[0, 0]];
    }
}

class ShapeJ extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, 1]];
    }
    pivotPoints() {
        return [[0, 0]];
    }
}

class ShapeL extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, -1]];
    }
    pivotPoints() {
        return [[0, 0]];
    }
}

class ShapeS extends Shape {
    static get blockCoords() {
        return [[-1, -1], [-1, 0], [0, 0], [0, 1]];
    }
    pivotPoints() {
        return [[0, 0]];
    }
}

class ShapeZ extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [-1, 0], [-1, 1]];
    }
    pivotPoints() {
        return [[0, 0]];
    }
}

const SHAPES = [
    ShapeI, ShapeO, ShapeT, ShapeJ, ShapeL, ShapeS, ShapeZ
];