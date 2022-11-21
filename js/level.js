const background = Resource.addAsset("img/E1-1024px.jpg");

class Level extends GameObject {

	static get image() { return Resource.getAsset(background); }
	get imageWidth() { return 1024; }
	get imageHeight() { return 683; }

	constructor() {
		super(0, 0);
		// Monitor resizing of the canvas
		this.canvasWidth = null;
		this.canvasHeight = null;
	}

	/**
	 * Draw the object
	 * @param {GameArea} gameArea 
	 */
	draw(gameArea) {
		// Only make the cached image dirty if necessary
		if (gameArea.width != this.canvasWidth
				|| gameArea.height != this.canvasHeight) {
			this.canvasWidth = gameArea.width;
			this.canvasHeight = gameArea.height;

			this.x = this.canvasWidth / 2;
			this.y = this.canvasHeight / 2;
			this.scale = Math.min(
				this.canvasWidth / this.imageWidth,
				this.canvasHeight / this.imageHeight,
			);
		}
		super.draw(gameArea);
	}
}