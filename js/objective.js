"use strict";

function plural(num, singular, plural = null) {
    if (num === 1)
        return `${num} ${singular}`;
    if (plural === null)
        return `${num} ${singular}er`;
    return `${num} ${plural}`;
}

const DEFAULT_PROGRESS_RESET_TIME = 1000;

class Objective {
    static get BlockTypes() { return new Map([[Block, 1]]); }
    /**
     * @param {Level} level 
     */
    constructor(level, descriptionShort, BlockTypes = null, descriptionLong = null, progressResetTime = DEFAULT_PROGRESS_RESET_TIME) {
        this.level = level;
        this.descriptionShort = descriptionShort;
        this.descriptionLong = descriptionLong || descriptionShort;

        BlockTypes ??= this.constructor.BlockTypes;
        const blockPool = [];
        for (const [BlockType, weight] of BlockTypes.entries()) {
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
    onRowsCleared(row) {}

    maybeShowIntroduction() {}

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
    constructor(level, numRows, BlockTypes = null) {
        super(level, `Rensa ${plural(numRows, "rad")}`, BlockTypes);
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

class ClearNRowsSimultaneouslyObjective extends Objective {
    constructor(level, numRows, BlockTypes = null) {
        numRows = Math.max(2, Math.min(numRows, 4));
        super(level, `Rensa ${numRows} rader samtidigt`, BlockTypes);
        this.numRows = numRows;
    }

    onRowsCleared(rows) {
        if (rows.length >= this.numRows) {
            this.setProgress(1);
            this.level.onObjectiveCompleted();
        }
    }
}

class ClearSpecificRowObjective extends Objective {
    constructor(level, row, BlockTypes = null) {
        row = Math.max(0, Math.min(row, 9));
        const ordering = ['första', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde'][row];
        super(level, `Rensa den ${ordering} raden`, BlockTypes);
        this.row = row;
    }

    onRowCleared(row) {
        if (row === this.row) {
            this.setProgress(1);
            this.level.onObjectiveCompleted();
        }
    }
}

class ZapNBlocksObjective extends Objective {
    constructor(level, numBlocks, BlockTypes = null, blockTypeRestriction = null) {
        let message;
        if (blockTypeRestriction !== null) {
            message = `Zappa ${plural(numBlocks, blockTypeRestriction.adjectiveSingular + " fadder", blockTypeRestriction.adjectivePlural + " faddrar")}`;
        } else {
            message = `Zappa ${plural(numBlocks, "fadder", "faddrar")}`;
        }
        super(level, message, BlockTypes);
        this.numBlocks = numBlocks;
        this.remaining = numBlocks;
        this.blockTypeRestriction = blockTypeRestriction;
    }

    onBlockZapped(block) {
        if (this.blockTypeRestriction !== null && !(block instanceof this.blockTypeRestriction))
            return;
        if (block instanceof ShadedBlock && block.hp > 0)
            return;

        this.remaining = Math.max(0, this.remaining - 1);
        this.setProgress(1 - this.remaining / this.numBlocks);
        if (this.remaining === 0)
            this.level.onObjectiveCompleted();
    }
}

class SettleNShapesObjective extends Objective {
    constructor(level, numShapes, shapeTypeRestriction = null, BlockTypes = null) {
        let groupPrefix;
        if (shapeTypeRestriction !== null)
            groupPrefix = shapeTypeRestriction.name[shapeTypeRestriction.name.length - 1] + "-";
        else
            groupPrefix = "";
        super(level, `Placera ut ${plural(numShapes, groupPrefix + "grupp")}`, BlockTypes);
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

class SettleNShapesWithBlockObjective extends Objective {
    constructor(level, numShapes, BlockTypes = null, blockTypeRestriction = null) {
        let message;
        if (blockTypeRestriction !== null)
            message = `Placera ut ${plural(numShapes, 'grupp')} med ${blockTypeRestriction.adjectivePlural} faddrar`;
        else
            message = `Placera ut ${plural(numShapes, 'grupp')}`;

        super(level, message, BlockTypes);
        this.numShapes = numShapes;
        this.remaining = numShapes;
        this.blockTypeRestriction = blockTypeRestriction;
    }

    /**
     * @param {Shape} shape 
     */
    onShapeSettled(shape) {
        if (this.blockTypeRestriction !== null && !shape.blocks.some(block => block instanceof this.blockTypeRestriction))
            return;

        this.remaining = Math.max(0, this.remaining - 1);
        this.setProgress(1 - this.remaining / this.numShapes);
        if (this.remaining === 0)
            this.level.onObjectiveCompleted();
    }

}

class SettleNShapesWithRudeBlockIntroductionObjective extends SettleNShapesWithBlockObjective {
    static get BlockTypes() { return new Map([[Block, 5], [RudeBlock, 1]]); }

    constructor(level, numShapes, BlockTypes = null) {
        super(level, numShapes, BlockTypes, RudeBlock);
    }

    maybeShowIntroduction() {
        if (Controller.instance.hasSeenBlockIntroduction.indexOf(RudeBlock.name) === -1) {
            Controller.instance.showBlockIntroduction(RudeBlock);
        }
    }
}

class ZapNShadedBlocksWithIntroductionObjective extends ZapNBlocksObjective {
    static get BlockTypes() { return new Map([[Block, 6], [ShadedBlock, 1]]); }

    constructor(level, numBlocks, BlockTypes = null) {
        super(level, numBlocks, BlockTypes, ShadedBlock);
    }

    maybeShowIntroduction() {
        if (Controller.instance.hasSeenBlockIntroduction.indexOf(ShadedBlock.name) === -1) {
            Controller.instance.showBlockIntroduction(ShadedBlock);
        }
    }
}

class ZapNBlocksWithConfusedIntroductionObjective extends ZapNBlocksObjective {
    static get BlockTypes() { return new Map([[Block, 6], [ConfusedBlock, 1]]); }

    constructor(level, numBlocks, BlockTypes = null) {
        super(level, numBlocks, BlockTypes);
    }

    maybeShowIntroduction() {
        if (Controller.instance.hasSeenBlockIntroduction.indexOf(ConfusedBlock.name) === -1) {
            Controller.instance.showBlockIntroduction(ConfusedBlock);
        }
    }
}

class ZapNSleepyBlocksWithIntroductionObjective extends ZapNBlocksObjective {
    static get BlockTypes() { return new Map([[Block, 6], [SleepyBlock, 1]]); }

    constructor(level, numBlocks, BlockTypes = null) {
        super(level, numBlocks, BlockTypes, SleepyBlock);
    }

    maybeShowIntroduction() {
        if (Controller.instance.hasSeenBlockIntroduction.indexOf(SleepyBlock.name) === -1) {
            Controller.instance.showBlockIntroduction(SleepyBlock);
        }
    }
}

class ZapNBlocksWithFragvisaIntroductionObjective extends ZapNBlocksObjective {
    static get BlockTypes() { return new Map([[Block, 6], [FragvisBlock, 1]]); }

    constructor(level, numBlocks, BlockTypes = null) {
        super(level, numBlocks, BlockTypes);
    }

    maybeShowIntroduction() {
        if (Controller.instance.hasSeenBlockIntroduction.indexOf(FragvisBlock.name) === -1) {
            Controller.instance.showBlockIntroduction(FragvisBlock);
        }
    }
}
