"use strict";

function plural(num, singular, plural = null) {
    if (num === 1)
        return `${num} ${singular}`;
    if (plural === null)
        return `${num} ${singular}er`;
    return `${num} ${plural}`;
}

class Objective {
    static get BlockTypes() { return new Map([[Block, 1]]); }
    /**
     * @param {Level} level 
     */
    constructor(level, descriptionShort, descriptionLong = null, progressResetTime = 1000) {
        this.level = level;
        this.descriptionShort = descriptionShort;
        this.descriptionLong = descriptionLong || descriptionShort;
        const blockPool = [];
        for (const [BlockType, weight] of this.constructor.BlockTypes.entries()) {
            for (let i = 0; i < weight; i++) {
                blockPool.push(BlockType);
            }
        }
        this.blockPool = new InfiniteBag(blockPool, /*copies=*/2);

        if (progressResetTime > 0) {
            // Det är trevligt att få se att man kom upp i 100%,
            // så vänta lite med att nolla progress baren.
            setTimeout(this.initializeUIElements.bind(this), progressResetTime);
        } else {
            this.initializeUIElements();
        }
    }

    /**
     * @param {number} num 
     * @returns {(typeof Block)[]}
     */
    getNextBlocks(num = 4) {
        return new Array(num).fill(null).map(_ => this.blockPool.pop());
    }

    initializeUIElements() {
        Controller.instance.setObjectiveShortDescription(this.descriptionShort);
        this.setProgress(0);
    }

    onShapeSettled(shape) {}
    onBlockSettled(block) {}
    onBlockZapped(block) {}
    onRowCleared(row) {}

    // Picks a random block from the classes BlockTypes,
    // considering the different normalized probabilities.
    randomBlock() {
        const blocktypes = this.constructor.BlockTypes;
        let sum = 0.0;
        for (const v of blocktypes.values()) {
            sum += v;
        }
        let weight = 0.0;
        const value = Math.random() * sum;
        for (const block of blocktypes.keys()) {
            weight += blocktypes.get(block)
            if (value < weight) {
                return block;
            }
        }
    }

    // Progress is in the range 0-1.
    setProgress(progress) {
        Controller.instance.setObjectiveProgress(progress);
        this.level.updateScore(progress);
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

class ZapNShadedBlocksObjective extends Objective {
    static get BlockTypes() {
        return new Map([[Block, 4], [ShadedBlock, 1]]);
    }

    constructor(level, numBlocks) {
        super(level, `Zappa ${plural(numBlocks, "skyddad fadder", "skyddade faddrar")}`);
        this.numBlocks = numBlocks;
        this.remaining = numBlocks;
    }

    onBlockZapped(block) {
        if (block.constructor.name == ShadedBlock.name && block.hp <= 0) {
            this.remaining = Math.max(0, this.remaining - 1);
            this.setProgress(1 - this.remaining / this.numBlocks);
            if (this.remaining === 0)
                this.level.onObjectiveCompleted();
        }
    }
}

class ZapNSleepingBlocksObjective extends Objective {
    static get BlockTypes() {
        return new Map([[Block, 4], [SleepyBlock, 1]]);
    }

    constructor(level, numBlocks) {
        super(level, `Zappa ${plural(numBlocks, "sovande fadder", "sovande faddrar")}`);
        this.numBlocks = numBlocks;
        this.remaining = numBlocks;
    }

    onBlockZapped(block) {
        if (block.constructor.name == SleepyBlock.name) {
            this.remaining = Math.max(0, this.remaining - 1);
            this.setProgress(1 - this.remaining / this.numBlocks);
            if (this.remaining === 0)
                this.level.onObjectiveCompleted();
        }
    }
}

class ZapNRudeBlocksObjective extends Objective {
    static get BlockTypes() {
        return new Map([[Block, 6], [RudeBlock, 1]]);
    }

    constructor(level, numBlocks) {
        super(level, `Zappa ${plural(numBlocks, "dryg fadder", "dryga faddrar")}`);
        this.numBlocks = numBlocks;
        this.remaining = numBlocks;
    }

    onBlockZapped(block) {
        if (block instanceof RudeBlock) {
            this.remaining = Math.max(0, this.remaining - 1);
            this.setProgress(1 - this.remaining / this.numBlocks);
            if (this.remaining === 0)
                this.level.onObjectiveCompleted();
        }
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

class SettleNShapesWithConfusedBlocks extends Objective {
    static get BlockTypes() {
        return new Map([[Block, 6], [ConfusedBlock, 1]]);
    }

    constructor(level, numShapes) {
        super(level, `Placera ${plural(numShapes, "grupp")} med vilsna faddrar`);
        this.numShapes = numShapes;
        this.remaining = numShapes;
    }

    /**
     * @param {Shape} shape 
     */
    onShapeSettled(shape) {
        if (shape.blocks.some(block => block instanceof ConfusedBlock)) {
            this.remaining = Math.max(0, this.remaining - 1);
            this.setProgress(1 - this.remaining / this.numShapes);
            if (this.remaining === 0)
                this.level.onObjectiveCompleted();
        }
    }

}


