const lillie = Resource.addAsset("img/lillie.png");

class Block extends GameObject {
    static get image() { return Resource.getAsset(lillie); }
    static get scale() { return 0.05; }

    /**
     * 
     * @param {Level} level 
     */
    constructor(level) {
        super(0, 0);
        this.row = level.numRows - 1;
        this.column = 4;  // It just works.
        this.level = level;
        this.baseScale = this.scale;
    }

    draw(gameArea) {
        if (!this.level.isAvailable(this.row, this.column))
            return;
        [this.x, this.y] = this.level.positions[this.row][this.column];
        this.scale = this.baseScale * this.level.getScale(this.row);
        super.draw(gameArea);
    }
}