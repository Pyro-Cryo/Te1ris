"use strict";

let FADDER_GROUPS = [
    // Mapp, antal filer (1.png-N.png) i mappen.
    ["fjadrande", 4],
    // ["flortiga", 2],
    // ["gamlingar", 3],
    ["maskotar", 4],
    ["misc", 11],
    ["ordf", 4],
];
if (new Date().getHours() === 12 && new Date().getMinutes() < 15) {
    // Ordförande ska firas kl 12 varje dag.
    FADDER_GROUPS = FADDER_GROUPS.filter(group => group[0] === "ordf");
    console.log('Ja må han leva');
}
const FADDER_IMAGES = new Map(
    FADDER_GROUPS.map(spec => [
        spec[0],
        new Array(spec[1]).fill(0).map(
            (_, i) => Resource.addAsset(`img/faddrar/${spec[0]}/${i+1}.png`)
        )
    ])    
);
const FRAGVISA_IMAGES = new Array(4).fill(0).map(
    (_, i) => Resource.addAsset(`img/faddrar/fragvisa/${i+1}.png`)
);

class Block extends EffectObject {
    static get scale() { return 0.115; }
    static get adjectiveSingular() { return "vanlig"; }
    static get adjectivePlural() { return "vanliga"; }

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
        this.walkingOriginalAngle = this.angle;
        Controller.instance.registerObject(this, this.layer);
        this.updatePositionAndRescale();
        this.isSettled = false;
        this.isChangingLayer = false;
        this.hasLeftMap = false;
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
        this.isChangingLayer = true;
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

    get isWalking() {
        return this.walkingPathRowColumn !== null;
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
        this.hasLeftMap = false;
    }

    removeFromMap() {
        if (this.level.isInMap(this.row, this.column)) {
            this.level.occupied[this.row][this.column] = false;
            this.level.settledBlocks[this.row][this.column] = null;
        }
        this.hasLeftMap = true;
    }

    update(delta) {
        super.update(delta);
        this.isChangingLayer = false;
        if (this.walkingPathRowColumn !== null) {
            this.walkingProgress += delta * this.walkingSpeed / this.walkingPathRowColumn.length;

            if (this.walkingProgress >= 1) {
                this.walkingPathRowColumn = null;
                this.walkingPathXYScale = null;
                this.layer = this.rowToLayer(this.row);
                this.angle = this.walkingOriginalAngle;
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

            // Update the angle so the block waddles a bit.
            this.angle = this.walkingOriginalAngle + 35 * (walkingProgressAsIndex % 2 - 0.5) * DEG_TO_RAD;
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

    /**
     * @param {GameArea} gameArea 
     */
    drawPreview(gameArea) {
        this.x = gameArea.gridWidth / 2;
        this.y = gameArea.gridHeight / 2;
        this.rescaleEffects(this.scale / this.baseScale);
        super.draw(gameArea);
    }

    draw(gameArea) {
        if (this.updatePositionAndRescale())
            super.draw(gameArea);
    }

    despawn() {
        this.level.settledBlocks[this.row][this.column] = null;
        this.level.occupied[this.row][this.column] = false;
        this.hasLeftMap = true;
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

    onPathCompleted() {
        this.level.checkCompleteRows();
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
            const fire = new FireParticle(this);
            if (this.isChangingLayer) {
                // The block is moving between layers and will be appended and drawn after the fires.
                // Make sure the fires are moved after the block in this layer, so that they are drawn on top.
                Controller.instance.scheduleLayerChange(fire, this.layer, this.layer);
            }
        }
    }

    walkPath(rowColumnPath) {
        if (this.walkingPathRowColumn !== null)
            throw new Error(`Cannot walk path: ${rowColumnPath}, already walking along: ${this.walkingPathRowColumn}`);

        this.walkingPathRowColumn = rowColumnPath;
        this.walkingPathXYScale = this.level.rowColumnPathToPositionScaleCoordinates(rowColumnPath);
        this.walkingProgress = 0;
        this.walkingOriginalAngle = this.angle;
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
    static get imgOffset() { return [0, -2]; }
}

class ShadedBlock extends Block {
    static get adjectiveSingular() { return "cool"; }
    static get adjectivePlural() { return "coola"; }

    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.hp = 2;
        this.shades = new SunglassEffect();
        this.addEffect(this.shades);
    }

    onZapped() {
        if (--this.hp <= 0) {
            return super.onZapped();
        }
        this.removeEffect(this.shades);
        return false;
    }
}

class BaseParticle extends GameObject {
    /**
     * @param {Block} block 
     */
    constructor(block, image = null, SpawningEffect = ScalingEffect) {
        const [offsetX, offsetY] = [
            ...block.effects.values()
        ].find(
            effect => effect instanceof SpawningEffect
        ).imgOffset;
        super(
            block.x + offsetX,
            block.y + offsetY,
            /*image=*/image,
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

const singleQuestionMarkImage = Resource.addAsset('img/questionmark.png');
const questionMarksImage = Resource.addAsset('img/questionmarks.png');

class ConfusedParticle extends BaseParticle {
    static get image() { return Resource.getAsset(singleQuestionMarkImage); }
    static get scale() { return 0.075; }
}

class ConfusedEffect extends ScalingEffect {
    static get image() { return Resource.getAsset(questionMarksImage); }
    static get scale() { return 0.075; }
    static get imgOffset() { return [0, -12]; }
}

class ConfusedBlock extends Block {
    static get adjectiveSingular() { return "vilsen"; }
    static get adjectivePlural() { return "vilsna"; }

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
                    new ConfusedParticle(this, /*image=*/null, ConfusedEffect);
                }
            }
        }
    }
}

const pillowImage = Resource.addAsset('img/pillow.png');
const Z_IMAGES = [1,2,3,4,5].map(index => 
    Resource.addAsset(`img/z/z${index}.png`)
);
class SleepyEffect extends ScalingEffect {
    static get image() { return Resource.getAsset(pillowImage); }
    static get scale() { return 0.125; }
    static get angle() { return 20 * DEG_TO_RAD; }
    static get imgOffset() { return [12, 5]; }
    static get drawBefore() { return true; }
}

class SleepingParticle extends BaseParticle {
    static get scale() { return 0.15; }

    constructor(block) {
        const image = Resource.getAsset(
            Z_IMAGES[Math.floor(Math.random() * Z_IMAGES.length)]
        );
        super(block, image);
    }
}

class SleepingEffect extends ScalingEffect {
    static get image() {
        return Resource.getAsset(
            Z_IMAGES[Math.floor(Math.random() * Z_IMAGES.length)]
        );
    }
    static get scale() { return 0.15; }
    static get imgOffset() { return [12, -12]; }

    constructor() {
        super();
        this.PARTICLE_TIME = 500;
        this.particleTimer = this.PARTICLE_TIME;
        this.block = null;
    }

    init(object) {
        super.init(object);
        this.block = object;
    }

    update(object, delta) {
        super.update(object, delta);
        this.particleTimer -= delta;
        if (this.particleTimer <= 0) {
            this.particleTimer += this.PARTICLE_TIME * (1 + Math.random());
            new SleepingParticle(this.block, /*image=*/null, SleepingEffect);
        }
    }
}

class SleepyBlock extends Block {
    static get adjectiveSingular() { return "sömnig"; }
    static get adjectivePlural() { return "sömniga"; }

    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.sleepeffect = new SleepyEffect();
        this.sleepTimer = 250 + Math.random() * 5000;
        this.isAsleep = false;
        this.addEffect(this.sleepeffect);
    }

    fallAsleep() {
        this.isAsleep = true;
        if (this.sleepeffect !== null) {
            this.removeEffect(this.sleepeffect);
        }
        this.sleepeffect = new SleepingEffect();
        this.addEffect(this.sleepeffect);
        this.angle = 20 * DEG_TO_RAD;
    }

    update(delta) {
        super.update(delta);
        if (this.isAsleep || !this.isSettled) {
            return;
        }
        this.sleepTimer -= delta
        if (this.sleepTimer <= 0) {
            this.fallAsleep();
        }
    }

    falldown() {
        // Sovande faddrar hoppar inte ner.
        if (this.isAsleep) {
            return false;
        }
        return super.falldown();
    }
}

const jacketImage = Resource.addAsset('img/jacka.png');
const backpackImage = Resource.addAsset('img/backpack.png');

class RudeEffect extends ScalingEffect {
    constructor(left) {
        super();
        this.left = left;
        this.scaleMultiplierWhenSettled = 1.25;
    }

    /**
     * @param {Block} block 
     */
    onSettle(block) {
        const obstacleColumn = block.column + (this.left ? -1 : 1);
        if (block.level.isFree(block.row, obstacleColumn)) {
            const obstacle = new Block(block.row, obstacleColumn, block.level, this.constructor.image);
            obstacle.level.occupied[obstacle.row][obstacle.column] = true;
            obstacle.level.settledBlocks[obstacle.row][obstacle.column] = obstacle;
            obstacle.baseScale = this.baseScale * this.scaleMultiplierWhenSettled;
            obstacle.scale = this.scale * this.scaleMultiplierWhenSettled;
            obstacle.angle = this.angle * 3;
            obstacle.onSettle();
        }
        block.removeEffect(this);
    }
}

class JacketEffect extends RudeEffect {
    static get image() { return Resource.getAsset(jacketImage); }
    static get angle() { return -5 * DEG_TO_RAD; }
    static get scale() { return 0.12; }
    static get imgOffset() { return [-12, 5]; }
    constructor() { super(true); }
}

class BackpackEffect extends RudeEffect {
    static get image() { return Resource.getAsset(backpackImage); }
    static get angle() { return 5 * DEG_TO_RAD; }
    static get scale() { return 0.12; }
    static get imgOffset() { return [12, 5]; }
    constructor() { super(false); }
}

class RudeBlock extends Block {
    static get adjectiveSingular() { return "dryg"; }
    static get adjectivePlural() { return "dryga"; }

    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.jacketEffect = new JacketEffect();
        this.backpackEffect = new BackpackEffect();
        this.addEffect(this.jacketEffect);
        this.addEffect(this.backpackEffect);
    }

    onSettle() {
        super.onSettle();
        this.jacketEffect.onSettle(this);
        this.backpackEffect.onSettle(this);
    }
}

const fragvisImage = Resource.addAsset("img/fragvis.png");

class FragvisEffect extends ScalingEffect {
    static get image() { return Resource.getAsset(fragvisImage); }
    static get scale() { return 0.075; }
    static get imgOffset() { return [8, -10]; }
}

class FragvisBlock extends Block {
    static get adjectiveSingular() { return "Frågvis"; }
    static get adjectivePlural() { return "Frågvisa"; }

    constructor(row, column, level, image) {
        super(row, column, level, image);
        this.hasMovedForward = false;
        this.addEffect(new FragvisEffect());
    }

    onSettle() {
        super.onSettle();
        if (this.hasMovedForward) return;

        // Det här kanske blir för starkt, så eventuellt vill man begränsa platserna de kan nå
        // genom att använda this.level.backtrackingMatrixFrom(this.row, this.column);
        for (let row = 0; row < this.row; row++) {
            const candidates = [];
            for (let column = 0; column < this.level.numColumns; column++) {
                if (!this.level.isFree(row, column)) continue;
                // Prioritize filling seats that are hard to get to (i.e. where the nearby seats are occupied).
                const seatAboveOccupied = !this.level.isFree(row + 1, column);
                const leftSeatOccupied = !this.level.isFree(row, column - 1);
                const rightSeatOccupied = !this.level.isFree(row, column + 1);
                candidates.push({
                    row: row,
                    column: column,
                    score: 10 * seatAboveOccupied + leftSeatOccupied + rightSeatOccupied,
                });
            }

            if (candidates.length !== 0) {
                const bestCandidate = candidates.reduce(
                    (best, current) => current.score > best.score ? current : best
                );
                const path = this.level.simplePathBetween(
                    this.row, this.column, bestCandidate.row, bestCandidate.column
                );
                this.walkPath(path);
                this.hasMovedForward = true;
                return;
            }
        }
    }
}
