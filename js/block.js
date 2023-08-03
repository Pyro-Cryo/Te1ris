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
        this.walkingSpeed = 3 / 1000;
        this.walkingProgress = 0;
        // Minimum difference in scale that should cause an update of the block's drawn size.
        this.walkingScaleMinDelta = 0.005;
        Controller.instance.registerObject(this, this.layer);
        this.updatePositionAndRescale();
        this.isSettled = false;
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

    removeFromMap() {
        if (this.level.isInMap(this.row, this.column)) {
            this.level.occupied[this.row][this.column] = false;
            this.level.settledBlocks[this.row][this.column] = null;
        }
    }

    update(delta) {
        super.update(delta);
        if (this.walkingPathRowColumn !== null) {
            this.walkingProgress += delta * this.walkingSpeed / this.walkingPathRowColumn.length;

            if (this.walkingProgress >= 1) {
                this.walkingPathRowColumn = null;
                this.walkingPathXYScale = null;
                this.layer = this.rowToLayer(this.row);
                this.onPathCompleted();
                return;
            }

            // Update the position and scale.
            let scaleMultiplier;
            [this.x, this.y, scaleMultiplier] = Splines.interpolateHermite(this.walkingProgress, this.walkingPathXYScale);
            const newScale = this.baseScale * scaleMultiplier;
            if (Math.abs(this.scale - newScale) >= this.walkingScaleMinDelta) {
                this.scale = newScale;
                this.rescaleEffects(scaleMultiplier);
            }

            // Update the layer. Walking progress is strictly less than 1, thus the index is strictly less than the path length.
            const walkingProgressAsIndex = Math.floor(this.walkingProgress * this.walkingPathRowColumn.length)
            const pseudoRow = this.walkingPathRowColumn[walkingProgressAsIndex][0];
            this.layer = this.rowToLayer(pseudoRow);
        }
    }

    rescaleEffects(scaleMultiplier) {
        for (const effect of this.effects) {
            if (effect.baseScale !== undefined) {
                effect.scale = effect.baseScale * scaleMultiplier;
            }
            if (effect.baseOffset !== undefined) {
                const [baseOffsetX, baseOffsetY] = effect.baseOffset;
                effect.imgOffset[0] = baseOffsetX === null ? null : baseOffsetX * scaleMultiplier;
                effect.imgOffset[1] = baseOffsetY === null ? null : baseOffsetY * scaleMultiplier;
            }
        }
    }

    updatePositionAndRescale() {
        if (this.walkingPathRowColumn !== null)
            return true; // Handled in update().
        if (!this.level.isInMap(this.row, this.column))
            return false;

        [this.x, this.y] = this.level.positions[this.row][this.column];
        const scaleMultiplier = this.level.getScale(this.row, this.column);
        this.scale = this.baseScale * scaleMultiplier;
        this.rescaleEffects(scaleMultiplier);
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

    onSettle() {
        this.isSettled = true;
    }

    /**
     * Zap the block (clearing it in regular tetris).
     * @returns true *if the block moved*, false otherwise.
     */
    onZapped() {
        this.despawn();
        return true;
    }

    onPathCompleted() {}

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

    walkPath(rowColumnPath) {
        if (this.walkingPathRowColumn !== null)
            throw new Error(`Cannot walk path: ${rowColumnPath}, already walking along: ${this.walkingPathRowColumn}`);

        this.walkingPathRowColumn = rowColumnPath;
        this.walkingPathXYScale = this.level.rowColumnPathToPositionScaleCoordinates(rowColumnPath);
        this.walkingProgress = 0;
        const [newRow, newColumn] = rowColumnPath[rowColumnPath.length - 1];
        if (this.level.isInMap(newRow, newColumn)) {
            this.move(newRow, newColumn);
        } else {
            this.removeFromMap();
            this.row = newRow;
            this.column = newColumn;
        }
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

class ScalingEffect extends BaseEffect {
    constructor() {
        super();
        this.baseScale = this.constructor.scale;
        this.baseOffset = this.constructor.imgOffset;
    }

    update(object, delta) {}
}


// Dummy effect to display sunglasses on blocks.
const sunglassesImage = Resource.addAsset('img/glasögon.png');
class SunglassEffect extends ScalingEffect {
    static get image() { return Resource.getAsset(sunglassesImage); }
    static get scale() { return 0.05; }
    static get imgOffset() { return [null, null]; }
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

const singleQuestionMarkImage = Resource.addAsset('img/questionmark.png');
const questionMarksImage = Resource.addAsset('img/questionmarks.png');

class ConfusedParticle extends GameObject {
    static get image() { return Resource.getAsset(singleQuestionMarkImage); }
    static get scale() { return 0.075; }

    /**
     * @param {ConfusedBlock} block 
     */
    constructor(block) {
        const [offsetX, offsetY] = [
            ...block.effects.values()
        ].find(
            effect => effect instanceof ConfusedEffect
        ).imgOffset;
        super(
            block.x + offsetX,
            block.y + offsetY,
            /*image=*/null,
            /*angle=*/(Math.random() - 0.5) * 20 * Math.PI / 180,
            /*scale=*/null,
            /*register=*/false,
        );
        Controller.instance.registerObject(this, block.layer);
        this.speedY = -0.1;
        this.speedX = (Math.random() - 0.5) * 0.1;
        this.scale *= block.scale / block.baseScale;
        this.despawnTimer = 2500;
    }

    update(delta) {
        super.update(delta);
        this.x += this.speedX * delta;
        this.y += this.speedY * delta;
    }
}

class ConfusedEffect extends ScalingEffect {
    static get image() { return Resource.getAsset(questionMarksImage); }
    static get scale() { return 0.075; }
    static get imgOffset() { return [0, -12]; }
}

class ConfusedBlock extends Block {
    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.addEffect(new ConfusedEffect());
        this.numParticles = 5;
        this.PARTICLE_TIME = 2000;
        this.particleTimer = this.PARTICLE_TIME;
    }

    leave() {
        // Put this block topmost in its layer.
        Controller.instance.scheduleLayerChange(this, this.layer, this.layer);
        // Start walking towards the door.
        const targetColumn = this.level._aisleToColumn(rowWithDoor - 1, AISLE_LEFT);
        this.walkPath(this.level.simplePathBetween(this.row, this.column, rowWithDoor, targetColumn));
    }

    onPathCompleted() {
        this.despawnTimer = 500;
    }

    update(delta) {
        super.update(delta);
        if (this.isSettled && this.numParticles > 0) {
            this.particleTimer -= delta;
            if (this.particleTimer <= 0) {
                this.particleTimer += this.PARTICLE_TIME;
                if (--this.numParticles <= 0) {
                    this.leave();
                } else {
                    new ConfusedParticle(this);
                }
            }
        }
    }
}
