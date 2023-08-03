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

class Block extends EffectObject {
    static get scale() { return 0.10; }

    /**
     * @param {Level} level 
     */
    constructor(row, column, level, image) {
        super(0, 0, image, /*angle=*/null, /*scale=*/null, /*register=*/false);
        this._row = row;
        this.column = column;
        this.level = level;
        this._layer = this.rowToLayer(row);
        this.baseScale = this.scale;
        this.walkingPathRowColumn = null;
        this.walkingPathXYScale = null;
        // Walking speed in cells per millisecond
        this.walkingSpeed = 2 / 1000;
        this.walkingProgress = 0;
        // Minimum difference in scale that should cause an update of the block's drawn size.
        this.walkingScaleMinDelta = 0.04;
        Controller.instance.registerObject(this, this.layer);
        this.updatePositionAndRescale();
    }

    rowToLayer(row) {
        return 1 + this.level.numRows - row;
    }

    get layer() {
        return this._layer;
    }

    set layer(value) {
        if (value === this._layer)
            return;
        Controller.instance.scheduleLayerChange(this, this._layer, value);
        this._layer = value;
    }

    get row() {
        return this._row;
    }

    set row(value) {
        if (value === this._row)
            return;
        this._row = value;
        this.layer = this.rowToLayer(value);
    }

    /**
     * Move the block to a new position once it is settled in the level.
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
        this.scale = this.baseScale * this.level.getScale(this.row, this.column);
    }

    update(delta) {
        super.update(delta);
        if (this.walkingPathRowColumn !== null) {
            this.walkingProgress += delta * this.walkingSpeed / this.walkingPathRowColumn.length;

            if (this.walkingProgress >= 1) {
                this.walkingPathRowColumn = null;
                this.walkingPathXYScale = null;
                this.layer = this.rowToLayer(this.row);
                return;
            }

            // Update the position and scale.
            let newScale;
            [this.x, this.y, newScale] = Splines.interpolateHermite(this.walkingProgress, this.walkingPathXYScale);
            if (Math.abs(this.scale - newScale) >= this.walkingScaleMinDelta) {
                this.scale = this.baseScale * newScale;
            }

            // Update the layer. Walking progress is strictly less than 1, thus the index is strictly less than the path length.
            const walkingProgressAsIndex = Math.floor(this.walkingProgress * this.walkingPathRowColumn.length)
            const pseudoRow = this.walkingPathRowColumn[walkingProgressAsIndex][0];
            this.layer = this.rowToLayer(pseudoRow);
        }
    }

    updatePositionAndRescale() {
        if (this.walkingPathRowColumn !== null)
            return true; // Handled in update().
        if (!this.level.isInMap(this.row, this.column))
            return false;

        [this.x, this.y] = this.level.positions[this.row][this.column];
        this.scale = this.baseScale * this.level.getScale(this.row, this.column);
        for (const effect of this.effects) {
            if (effect.baseScale !== undefined) {
                effect.scale = effect.baseScale * this.level.getScale(this.row, this.column);
            }
        }
        return true;
    }

    draw(gameArea) {
        if (this.updatePositionAndRescale())
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

    spawnFires(num = null) {
        this.updatePositionAndRescale();
        num ??= Math.floor(Math.random() * 5) + 7;
        for (let i = 0; i < num; i++) {
            new FireParticle(this);
        }
    }

    // TODO: walkTo/walkPath does not support aisles/outside positions, since move() currently requires positions in the map.
    walkPath(rowColumnPath) {
        if (this.walkingPathRowColumn !== null)
            throw new Error(`Cannot walk path: ${rowColumnPath}, already walking along: ${this.walkingPathRowColumn}`);

        this.walkingPathRowColumn = rowColumnPath;
        this.walkingPathXYScale = this.level.rowColumnPathToPositionScaleCoordinates(rowColumnPath);
        this.walkingProgress = 0;
        const [newRow, newColumn] = rowColumnPath[rowColumnPath.length - 1];
        this.move(newRow, newColumn);
    }

    walkTo(row, columnOrAisle) {
        const matrix = this.level.backtrackingMatrixFrom(this.row, this.column);
        if (!this.level.isReachableInBacktrackingMatrix(row, columnOrAisle, matrix)) {
            throw new Error(`No path to [${row}, ${columnOrAisle}] from [${this.row}, ${this.column}] was found`);
        }
        this.walkPath(this.level.backtrackFrom(row, columnOrAisle, matrix));
    }
}


const fireImage = Resource.addAsset('img/eld.png');
class FireParticle extends GameObject {
    static get image() { return Resource.getAsset(fireImage); }
    static get scale() { return 0.15; }

    /**
     * @param {Block} block 
     */
    constructor(block) {
        const x = block.x + block.width * (Math.random() - 0.5);
        const y = block.y + block.height * (Math.random() - 0.5);
        super(x, y, /*image=*/null, /*angle=*/null, /*scale=*/null, /*register=*/false);
        this.scale *= block.scale / block.baseScale;
        const revealAfter = Math.random() * 250 + 250;
        this.despawnTimer = revealAfter + Math.random() * 500 + 500;
        this.revealBelow = this.despawnTimer - revealAfter;
        
        Controller.instance.registerObject(this, block.layer);
    }

    draw(gameArea) {
        if (this.despawnTimer <= this.revealBelow)
            super.draw(gameArea);
    }
}


// Dummy effect to display sunglasses on blocks.
const sunglassesImage = Resource.addAsset('img/glasögon.png');
class SunglassEffect extends BaseEffect {
    static get image() { return Resource.getAsset(sunglassesImage); }
    static get scale() { return 0.05; }
    static get imgOffset() { return [null, null]; }

    constructor() {
        super();
        this.baseScale = this.constructor.scale;
    }

    update(object, delta) {
    }
}

class ShadedBlock extends Block {
    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.hp = 2;
        this.shades = new SunglassEffect();
        this.addEffect(this.shades);
    }

    onZapped() {
        if (--this.hp <= 0) {
            this.despawn();
            return true;
        }
        this.removeEffect(this.shades);
        return false;
    }
}
