"use strict";

/**
 * @param {number[][]} arr 
 * @param {number} rowDelta 
 * @param {number} columnDelta 
 * @returns {number[][]}
 */
function addToPositionArray(arr, rowDelta, columnDelta) {
    return arr.map(pos => [pos[0] + rowDelta, pos[1] + columnDelta]);
}

/**
 * @param {number[][]} arr 
 * @param {number} rowPivot 
 * @param {number} columnPivot 
 * @param {boolean} clockwise 
 * @returns {number[][]}
 */
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

const fadderGroupsBag = new InfiniteBag(FADDER_GROUPS.map(x => x[0]), /*copies=*/2);

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
     * @param {(typeof Block)[]} BlockTypes 
     */
    static selectBlockImages(BlockTypes, peekGroup = false) {
        const group = peekGroup ? fadderGroupsBag.peek() : fadderGroupsBag.pop();
        const images = new InfiniteBag(FADDER_IMAGES.get(group));
        const fragvisaImages = new InfiniteBag(FRAGVISA_IMAGES);
        return BlockTypes.map(BlockType => Resource.getAsset(
            BlockType === FragvisBlock ? fragvisaImages.pop() : images.pop()
        ));
    }

    /**
     * @param {Number} row
     * @param {Number} column
     * @param {Level} level 
     * @param {function} onCannotCreate
     * @param {?(typeof Block)[]} BlockTypes
     */
    constructor(row, column, level, onCannotCreate, BlockTypes = null) {
        super(0, 0);
        this.blockCoordsRelative = this.constructor.blockCoords;
        this.rotation = 0;
        this.row = row;
        this.column = column;
        this.level = level;

        const blockCoords = this.getBlockCoords();
        // console.log(`Spawning ${this.constructor.name} at ${this.row}-${this.column}`);
        // console.log('Block coordinates:', JSON.stringify(blockCoords));
        if (BlockTypes === null) {
            BlockTypes = blockCoords.map(_ => Block);
        }
        else {
            BlockTypes = shuffle(BlockTypes);
        }

        if (!this.allFree(blockCoords)) {
            onCannotCreate();
            return;
        }
        const blockImages = this.constructor.selectBlockImages(BlockTypes);
        this.blocks = BlockTypes.map(
            (BlockType, i) => new BlockType(
                blockCoords[i][0],
                blockCoords[i][1],
                this.level,
                blockImages[i],
            )
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
            if (newCoords !== null) {
                this.setBlockCoords(newCoords);
            }
            this.level.onSettle();
        } else if (this.allFree(potentialNewCoords)) {
            this.row -= 1;
            this.setBlockCoords(potentialNewCoords);
        } else {
            this.level.onSettle();
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

class ShapePreview extends GameObject {
    /**
     * @param {number} x
     * @param {number} y
     * @param {typeof Shape} ShapeType
     */
    constructor(x, y, ShapeType = null) {
        super(x, y);
        this._drawTextToImage("Nästa grupp:");
        this.coords = null;
        this.images = null;
        this.blockScale = 0.2;
        this.blockSpacing = 50;
        this.updateShapeType(ShapeType);
    }

    _drawTextToImage(text) {
        let height = 32;
        const font = `bold ${height}px Nunito, sans-serif`;
        const baseline = "bottom";
        const color = "#222222";
        
        const canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        ctx.font = font;
        ctx.textBaseline = baseline;

        // Finns risk att Ä och liknande sticker ut, så mät om möjligt och multiplicera med en faktor.
        const metrics = ctx.measureText(text);
        if ("actualBoundingBoxAscent" in metrics && "actualBoundingBoxDescent" in metrics) {
            height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        }
        canvas.width = metrics.width;
        canvas.height = height * 1.5;
        if (canvas.width === 0 || canvas.height === 0) return;

        ctx = canvas.getContext("2d");  // Vi har skalat om canvasen, så vi behöver ny context.
        ctx.font = font;
        ctx.textBaseline = baseline
        ctx.fillStyle = color;
        ctx.fillText(text, 0, canvas.height);

        this.image = canvas;
    }

    /**
     * @param {?typeof Shape} ShapeType 
     */
    updateShapeType(ShapeType) {
        if (ShapeType === null) {
            this.coords = null;
            this.images = null;
            return;
        }

        const maxRowOffset = Math.max(...ShapeType.blockCoords.map(pos => pos[0])) + 1;
        const cols = ShapeType.blockCoords.map(pos => pos[1]);
        const colCenter = (Math.max(...cols) + Math.min(...cols)) / 2;
        this.coords = ShapeType.blockCoords.map(
            pos => [
                (maxRowOffset - pos[0]) * this.blockSpacing,
                (pos[1] - colCenter) * this.blockSpacing,
            ]);

        const GuessedBlockType = Controller.instance.level?.objective?.blockPool?.peek() ?? Block;
        this.images = ShapeType.selectBlockImages(
            new Array(this.coords.length).fill(GuessedBlockType),
            /*peekGroup=*/true,
        ).map(image => {
            const renderingObject = new PrerenderedObject(image, /*angle=*/null, this.blockScale);
            renderingObject.prerender();
            return renderingObject.imagecache;
        });
    }

    /**
     * @param {GameArea} gameArea 
     */
    draw(gameArea) {
        if (!this.images || !this.coords) return;
        super.draw(gameArea);
        for (let i = 0; i < this.images.length; i++) {
            const [yOffset, xOffset] = this.coords[i];
            const image = this.images[i];

            gameArea.draw(
                image,
                this.x + xOffset,
                this.y + yOffset,
                /*angle=*/0,
                /*scale=*/1,
            );
        }
    }
}
