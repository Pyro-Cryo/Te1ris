const background = Resource.addAsset("img/E1-1024px.jpg");

class Level extends PrerenderedObject {

	static get image(){ return Resource.getAsset(background); }

	constructor(){
		super();
		this.id = null;
	}

	update(delta){
	}

	/**
	 * Draw the object
	 * @param {GameArea} gameArea 
	 */
	draw(gameArea) {
		if (gameArea.usesGrid)
			super.draw(gameArea, gameArea.gridWidth, gameArea.gridHeight);
		else
			super.draw(gameArea, gameArea.width, gameArea.height);
	}
}