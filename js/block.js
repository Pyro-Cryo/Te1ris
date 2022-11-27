const lillie = Resource.addAsset("img/lillie.png");

class Block extends GameObject {
    static get image() { return Resource.getAsset(lillie); }
    static get scale() { return 0.05; }

    /**
     * @param {Level} level 
     */
    constructor(row, column, level) {
        super(0, 0);
        this.row = row;
        this.column = column;
        this.level = level;
        this.baseScale = this.scale;
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

/**
 * https://en.wikipedia.org/wiki/Tetromino#One-sided_tetrominoes
 */
class Shape extends GameObject {
    static get blockCoords() {
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
        this.row = row;
        this.column = column;
        this.level = level;
        this.onSettle = onSettle;

        const blockCoords = this.getBlockCoords();
        console.log(`Spawning ${this.constructor.name} at ${this.row}-${this.column}`);
        console.log('Block coordinates:', blockCoords);

        if (!this.allFree(blockCoords)) {
            onCannotCreate();
            return;
        }

        this.blocks = blockCoords.map(
            pos => new Block(pos[0], pos[1], this.level)
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
            this.blockCoordsRelative, this.row, this.column);
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
        console.log('Moving to the left');
        this._move(-1);
    }
    moveRight() {
        console.log('Moving to the right');
        this._move(1);
    }

    fall(toBottom = false) {
        console.log('Falling', toBottom ? 'to bottom' : '1 row');
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

    _rotate(quartersClockwise) {
        throw new Error('Not yet implemented');
    }

    rotateLeft() { this._rotate(-1); }
    rotateRight() { this._rotate(1); }
    
    // Blocks handle their own drawing
    draw(gameArea) {}
}

class ShapeI extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [0, 2]];
    }
}

class ShapeO extends Shape {
    static get blockCoords() {
        return [[0, 0], [0, 1], [-1, 0], [-1, 1]];
    }
}

class ShapeT extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, 0]];
    }
}

class ShapeJ extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, 1]];
    }
}

class ShapeL extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [0, 1], [-1, -1]];
    }
}

class ShapeS extends Shape {
    static get blockCoords() {
        return [[-1, -1], [-1, 0], [0, 0], [0, 1]];
    }
}

class ShapeZ extends Shape {
    static get blockCoords() {
        return [[0, -1], [0, 0], [-1, 0], [-1, 1]];
    }
}

const SHAPES = [
    ShapeI, ShapeO, ShapeT, ShapeJ, ShapeL, ShapeS, ShapeZ
];