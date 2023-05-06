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

    /**
     * Move the block to a new position ones it is settled in the level.
     */
    move(new_row, new_column) {
        if (!this.level.isFree(new_row, new_column))
            throw new Error('Attempted to move to an occupied square.');

        this.level.occupied[this.row][this.column] = false;
        this.level.settledBlocks[this.row][this.column] = null;

        this.row = new_row;
        this.column = new_column;

        this.level.occupied[this.row][this.column] = true;
        this.level.settledBlocks[this.row][this.column] = this;
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

    despawn() {
        this.level.settledBlocks[this.row][this.column] = null;
        this.level.occupied[this.row][this.column] = false;
        super.despawn();
    }

    /**
     * Zap the block (clearing it in regular tetris).
     * @returns true *if the block moved*, false otherwise.
     */
    onZapped() {
        this.despawn();
        return true;
    }

    /**
     * Trigger the block to fall down a row or otherwise do its
     * thing when a row has been cleared.
     * @returns True if the block moved, false otherwise.
     */
    falldown() {
        if (this.level.isFree(this.row - 1, this.column)) {
            this.move(this.row - 1, this.column);
            return true;
        }
        else {
            return false;
        }
    }

}
