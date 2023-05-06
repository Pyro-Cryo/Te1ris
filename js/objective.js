"use strict";

function plural(num, singular, plural = null) {
    if (num === 1)
        return `${num} ${singular}`;
    if (plural === null)
        return `${num} ${singular}er`;
    return `${num} ${plural}`;
}

class Objective {
    /**
     * @param {Level} level 
     */
    constructor(level, descriptionShort, descriptionLong = null, progressResetTime = 1000) {
        this.level = level;
        this.descriptionShort = descriptionShort;
        this.descriptionLong = descriptionLong || descriptionShort;
        this.shapePool = [];

        this.fillShapePool();
        if (progressResetTime > 0) {
            // Det är trevligt att få se att man kom upp i 100%,
            // så vänta lite med att nolla progress baren.
            setTimeout(this.initializeUIElements.bind(this), progressResetTime);
        } else {
            this.initializeUIElements();
        }
    }

    initializeUIElements() {
        Controller.instance.setObjectiveShortDescription(this.descriptionShort);
        this.setProgress(0);
    }

    fillShapePool() {
        const shuffled = shuffle(SHAPES.concat(SHAPES));
        this.shapePool = shuffled.concat(this.shapePool);
    }

    nextShape() {
        return this.shapePool[this.shapePool.length - 1];
    }

    onShapeSettled(shape) {}
    onBlockSettled(block) {}
    onBlockZapped(block) {}
    onRowCleared(row) {}

    spawnShape(row, column, onCannotCreate) {
        const ShapeType = this.shapePool.pop();
        const spawned = new ShapeType(
			/*row=*/row,
			/*column=*/column,
			/*level=*/this.level,
			/*onSettle=*/this.level.onSettle.bind(this.level),
			/*onCannotCreate=*/onCannotCreate
		);

        if (this.shapePool.length === 0) {
            this.fillShapePool();
        }
        return spawned;
    }

    // Progress is in the range 0-1.
    setProgress(progress) {
        Controller.instance.setObjectiveProgress(progress);
    }
}

class ClearNRowsObjective extends Objective {
    constructor(level, numRows) {
        super(level, `Rensa ${plural(numRows, "rad")}`);
        this.numRows = numRows;
        this.remaining = numRows;
    }

    onRowCleared(row) {
        this.remaining = Math.max(0, this.remaining - 1);
        this.setProgress(1 - this.remaining / this.numRows);
        if (this.remaining === 0)
            this.level.onObjectiveCompleted();
    }
}

class ZapNBlocksObjective extends Objective {
    constructor(level, numBlocks) {
        super(level, `Zappa ${plural(numBlocks, "fadder", "faddrar")}`);
        this.numBlocks = numBlocks;
        this.remaining = numBlocks;
    }

    onBlockZapped(block) {
        this.remaining = Math.max(0, this.remaining - 1);
        this.setProgress(1 - this.remaining / this.numBlocks);
        if (this.remaining === 0)
            this.level.onObjectiveCompleted();
    }
}

class SettleNShapes extends Objective {
    constructor(level, numShapes, shapeTypeRestriction = null) {
        let groupPrefix;
        if (shapeTypeRestriction !== null)
            groupPrefix = shapeTypeRestriction.name[shapeTypeRestriction.name.length - 1] + "-";
        else
            groupPrefix = "";
        super(level, `Placera ${plural(numShapes, groupPrefix + "grupp")}`);
        this.numShapes = numShapes;
        this.remaining = numShapes;
        this.shapeTypeRestriction = shapeTypeRestriction;
    }

    onShapeSettled(shape) {
        if (this.shapeTypeRestriction === null || shape instanceof this.shapeTypeRestriction) {
            this.remaining = Math.max(0, this.remaining - 1);
            this.setProgress(1 - this.remaining / this.numShapes);
            if (this.remaining === 0)
                this.level.onObjectiveCompleted();
        }
    }
}


