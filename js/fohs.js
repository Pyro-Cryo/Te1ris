"use strict";

const fohsFacePositionRight = [
    [1381, 443],
    [1281, 414],
    [1215, 381],
    [1169, 355],
    [1110, 344],
    [1076, 321],
    [1045, 297],
    [1018, 277],
    [996, 260],
    [979, 246],
    [959, 228],
    [875, 212],
    [862, 195],
    [854, 186],
    [846, 183],
];

const FOHS = {
    OF: 0,
    SF: 1,
    TF: 2,
};
const fohsImages = new Map([
    [FOHS.OF, Resource.addAsset('img/of.png')],
    [FOHS.SF, Resource.addAsset('img/sf.png')],
    [FOHS.TF, Resource.addAsset('img/tf.png')],
]);
const zapImage = Resource.addAsset('img/blixt.png');
const FOHS_DESPAWN_TIME = 1000;

class ZapParticle extends GameObject {
    static get image() { return Resource.getAsset(zapImage); }
    static get scale() { return 0.2; }
    static get angle() { return Math.PI / 2; }

    constructor(x, y, row, speed = null, /*spin = null,*/ spread = null, stop = null) {
        super(x, y, /*image=*/null, /*angle=*/null, /*scale=*/null, /*register=*/false);
        const level = Controller.instance.level;
        this.t = 0;
        this.path = level.positions[row].filter(pos => pos !== null)
        this.path.push([x, y]);
        this.path.reverse();
        // Amount of interpolation (t in range 0 to 1) to add per millisecond.
        this.speed = speed ?? (Math.random() * 1.3 + 0.2) / 1000;
        // Radians to add per millisecond.
        // this.spin = spin ?? (Math.random() - 0.5) / 100;
        // Y offset to add per millisecond.
        this.spread = spread ?? (Math.random() - 0.5) / 10;
        this.currentSpread = 0;
        // Time in milliseconds after which the particle despawns.
        this.despawnTimer = stop ?? Math.random() * 500 + 500;
        this.layer = 1 + level.numRows - row;

        Controller.instance.registerObject(this, this.layer);
    }

    update(delta) {
        super.update(delta);
        this.currentSpread += this.spread * delta;
        this.t += this.speed * delta;
        // this.angle += this.spin * delta;

        if (this.t >= 1) {
            this.despawn();
            return;
        }

        [this.x, this.y] = Splines.interpolateFullBezier(this.t, this.path);
        this.y += this.currentSpread;
    }
}

class Fohs extends GameObject {
    static get scale() { return 0.2; }

    constructor(row, fohsIndex) {
        super(
            /*x=*/fohsFacePositionRight[row][0],
            /*y=*/fohsFacePositionRight[row][1],
            /*image=*/null,
            /*angle=*/null,
            /*scale=*/null,
            /*register=*/false,
        );
        this.facePosition = [this.x, this.y];
        this.row = row;

        const level = Controller.instance.level;
        this.scale = this.constructor.scale * level.getScale(row);
        this.image = Resource.getAsset(fohsImages.get(fohsIndex));
        this.y += this.height * 0.3;
        this.despawnTimer = FOHS_DESPAWN_TIME;
        this.layer = 1 + level.numRows - row;
        this.zapTimer = 0;
        this.ZAP_TIME = 50;

        // Add fires to the blocks.
        for (const block of level.settledBlocks[row]) {
            if (block !== null) {
                block.spawnFires();
            }
        }

        Controller.instance.registerObject(this, this.layer);
    }

    update(delta) {
        super.update(delta);
        this.zapTimer -= delta;
        if (this.zapTimer <= 0) {
            new ZapParticle(this.facePosition[0], this.facePosition[1], this.row);
            this.zapTimer += this.ZAP_TIME;
        }
    }

    /**
     * Creates Fohs sprites that zap the indicated rows.
     * @param {number[]} rows The rows to zap.
     */
    static zapRows(rows) {
        let fohsIndices = [FOHS.SF, FOHS.OF, FOHS.TF];
        switch (rows.length) {
            case 0:
                return;
            case 1:
            case 2:
                // If only one or two rows are zapped, pick random föhs.
                fohsIndices = shuffle(fohsIndices).slice(0, rows.length);
                break;
            case 3:
                // If all three should appear, use the correct ordering.
                break;
            case 4:
                // If four rows are cleared at once, duplicate Överföhs.
                fohsIndices.splice(0, 0, FOHS.OF);
                break;
            default:
                // If, somehow, more than four rows are cleared, just keep adding them.
                while (fohsIndices.length < rows.length) {
                    fohsIndices = fohsIndices.concat(fohsIndices);
                }
                fohsIndices = shuffle(fohsIndices.slice(0, rows.length));
                break;
        }
        for (let i = 0; i < rows.length; i++) {
            new Fohs(rows[i], fohsIndices[i]);
        }
    }
}