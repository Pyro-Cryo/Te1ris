"use strict";

const music = Resource.addAsset("audio/myrstacken.mp3", LoopableAudioWithTail);

class TetrisController extends Controller {

	static get WIDTH_PX() { return 1440;}
	static get HEIGHT_PX() { return 789;}
	static get STORAGE_PREFIX() { return "_te1ris"; }

	constructor() {
		super("gameboard", /*updateInterval=*/1/30);
		this.canvasContainer = document.getElementById("gameboardContainer");
		this.objective = {
			root: document.getElementById("objective"),
			descriptionShort: document.getElementById("objectiveDescription"),
			progressBar: document.querySelector("#objectiveTracker > .progressBar"),
			progressBarLabel: document.getElementById("progress")
		};

		this.stateProperties = [];
		this.level = null;
		this.touchControls = new TouchControls(
			/*element=*/this.gameArea.canvas,
			/*onTap=*/(x, y) => {
				if (!this.level || !this.level.currentShape) return;
				// if (x > document.documentElement.clientHeight / 2) {
				// 	this.level.currentShape.fall(/*toBottom=*/false);
				// } else if (y > document.documentElement.clientWidth / 2) {
				// 	this.level.currentShape.rotateRight();
				// } else {
				// 	this.level.currentShape.rotateLeft();
				// }
				const bandWidth = document.documentElement.clientWidth / 3;
				if (x < bandWidth) {
					this.level.currentShape.rotateLeft();
				} else if (x < 2 * bandWidth) {
					this.level.currentShape.fall(/*toBottom=*/false);
				} else {
					this.level.currentShape.rotateRight();
				}
			},
			/*onSwipeDown=*/() => {
				if (!this.level || !this.level.currentShape) return;
				this.level.currentShape.fall(/*toBottom=*/true);
			},
			/*onSwipeHorizontal=*/xRelative => {
				if (!this.level || !this.level.currentShape) return;
				// Expand xRelative a bit so the edges are easier to reach.
				xRelative = (xRelative - 0.5) * 1.4 + 0.5;
				const targetColumn = Math.floor(this.level.numColumns * xRelative);
				const right = targetColumn > this.level.currentShape.column;
				let lastColumn = null;

				// Send moves in the correct direction until we get stuck or reach the intended column.
				while (this.level.currentShape.column !== targetColumn && lastColumn !== this.level.currentShape.column) {
					lastColumn = this.level.currentShape.column;
					if (right) {
						this.level.currentShape.moveRight();
					} else {
						this.level.currentShape.moveLeft();
					}
				}
			}
		);

		this.barHeight = 64;
		this.marginHorizontal = 0;
		this.marginVertical = 0;

		// A background covering the entire board is drawn every frame.
		this.clearOnDraw = false;
	}

	startDrawLoop() {
		this.setCanvasDimensions(this.barHeight, this.marginHorizontal, this.marginVertical);
		window.addEventListener(
			"resize", () => this.setCanvasDimensions(
				this.barHeight,
				this.marginHorizontal,
				this.marginVertical / 2
			)
		);
		super.startDrawLoop();
	}

	onAssetsLoaded() {
		super.onAssetsLoaded();
		this.clearOnDraw = false;
		this.setMessage(`Laddat klart`);
		this.setMusic(Resource.getAsset(music));
		if (this.muted) {
			this.currentMusic.volume = 0;
			this.muteButton.classList.add("hidden");
			this.unmuteButton.classList.remove("hidden");
		}
		this.startDrawLoop();
		this.loadState();
		this.createLevel();
		this.setupElements();
		this.onPause();
	}

	onAssetsLoadFailure(reason) {
		console.error(reason);
		if (reason instanceof Response)
			alert(`Spelet kunde inte laddas:\n${reason.status} ${reason.statusText}\n${reason.text()}`);
		else if (reason instanceof Event) 
			alert(`Spelet kunde inte laddas:\nHittade inte (eller kunde inte tolka) ${reason.path[0].src}`);
		else
			alert("Okänt fel vid laddning av spelet.\n" + JSON.stringify(reason));
		setInterval(() => this.setMessage("Spelet är trasigt :("), 6000);
		setTimeout(() => setInterval(() => this.setMessage("Hör av dig till utvecklarna eller Cyberföhs"), 6000), 3000);
		setTimeout(() => this.setMessage("Spelet är trasigt :("), 1000);
	}

	createLevel() {
		this.level = new Level();

	}

	setupElements() {
		// Resumeknappen på paussidan
		document.getElementById("resumeButton").addEventListener("click", e => {
			this.togglePause();
			e.preventDefault();
		}, true);
		// Respawnknappen ("försök igen") på du dog-sidan
		document.getElementById("respawnButton").addEventListener("click", e => {
			this.unregisterAllObjects();
			this.gameArea.resetDrawOffset();
			this.spawnPlayer();
			this.startLevel();
			document.getElementById("deathmenu").classList.add("hidden");
			this.currentMusic.currentTime = 0;
			this.currentMusic.play();
			e.preventDefault();
		}, true);
		// Restartknappar finns på både paus- och dogsidan
		const restartButtons = document.getElementsByClassName("restartButton");
		for (let i = 0; i < restartButtons.length; i++)
			restartButtons.item(i).addEventListener("click", e => {
				if (window.confirm("Är du säker på att du vill börja om från alla första början?")) {
					if (this.isFF)
						this.toggleFastForward();
					this.clearState();
					this.loadState(); // Laddar defaultstate
					this.unregisterAllObjects();
					this.gameArea.resetDrawOffset();
					this.spawnPlayer();
					this.startLevel();
					this.currentMusic.currentTime = 0;
					if (!this.isPaused) { // Dödsmenyn är uppe
						document.getElementById("deathmenu").classList.add("hidden");
						super.onPause(); // Pausa utan att öppna pausmenyn, eftersom vi vill visa choicemenu istället
					} else // Pausmenyn är uppe
						document.getElementById("pausemenu").classList.add("hidden");
					document.getElementById("choicemenu").classList.remove("hidden");
				}
				e.preventDefault();
			}, true);

		document.body.addEventListener("keydown", e => {
			if (e.code === "Escape") {
				if (!this.isPaused) {
					let noneOpen = true;
					const menus = document.getElementsByClassName("menu");
					for (let i = 0; i < menus.length; i++)
						noneOpen &= menus.item(i).classList.contains("hidden");
					if (noneOpen) {
						document.getElementById("playButton").click();
						e.preventDefault();
					}
				} else if (!document.getElementById("pausemenu").classList.contains("hidden")) {
					document.getElementById("resumeButton").click();
					e.preventDefault();
				}
			}
		}, true);
		
	}

	setCanvasDimensions(barHeight, marginHorizontal, marginVertical = null) {
		if (marginVertical === null)
			marginVertical = marginHorizontal;
		const maxWidthPx = document.documentElement.clientWidth - marginHorizontal * 2;
		const maxHeightPx = document.documentElement.clientHeight - barHeight - marginVertical * 2;
		const wScale = maxWidthPx / this.constructor.WIDTH_PX;
		const hScale = maxHeightPx / this.constructor.HEIGHT_PX;
		const scale = Math.min(wScale, hScale);

		this.gameArea.canvas.style = `transform: translateX(-50%) scale(${scale});`;
		this.canvasContainer.style = `height: ${scale * this.HEIGHT_PX}px;`;
	}

	loadState() {
		const defaultState = {
		};
		let data = window.localStorage.getItem(this.STORAGE_PREFIX + "state");
		if (data)
			data = JSON.parse(data);
		else
			data = defaultState;
		
		for (const prop of this.stateProperties) {
			if (!data.hasOwnProperty(prop))
				console.warn(`Property ${prop} missing in saved state`);
			this[prop] = data[prop];
		}
		// console.log("Loaded state", data);
	}

	saveState() {
		const data = {};
		for (const prop of this.stateProperties)
			data[prop] = this[prop];

		window.localStorage.setItem(this.STORAGE_PREFIX + "state", JSON.stringify(data));
		// console.log("Saved state", data);
	}

	clearState() {
		window.localStorage.removeItem(this.STORAGE_PREFIX + "state");
	}

	setObjectiveShortDescription(message) {
		this.objective.descriptionShort.innerText = message;
	}

	setObjectiveProgress(progress) {
		const rounded = Math.round(100 * Math.min(Math.max(progress, 0), 1));
		this.objective.progressBar.style.width = rounded + "%";
		this.objective.progressBarLabel.innerText = rounded;
	}

	messageIsHidden() {
		return this.messageBox.classList.contains("hidden");
	}

	onPlay() {
		super.onPlay();
		if (!this.messageIsHidden()) {
			this.hideMessage();
			this.objective.root.classList.remove("hidden");
		}
		document.getElementById("pausemenu").classList.add("hidden");
		if (!this.currentMusic) {
			this.currentMusic = Resource.getAsset(music);
			this.currentMusic.currentTime = 0;
		}
		this.currentMusic.play();
	}

	onPause() {
		super.onPause();
		document.getElementById("pausemenu").classList.remove("hidden");
		// this.funFacts();
		if (this.currentMusic)
			this.currentMusic.pause();
	}
}

class cheat {
	/**
	 * Kan togglas
	 */
	static get slowmo() {
		controller.fastForwardFactor = 1 / controller.fastForwardFactor;
		controller.toggleFastForward();
	}


	static get darkmode() {
		document.body.classList.add("dark");
		controller.background.dark = true;
		Background.dark = true;
	}

	static get break() {
		controller.registerObject({
			update: delta => (undefined).doesNotExist(),
			id: 123456789,
			draw: gameArea => null
		});
	}

	static get pickCoords() {
		const coords = [];
		controller.canvasContainer.addEventListener('click', e => {
			coords.push([e.offsetX, e.offsetY]);
			console.log(coords);
			this.sendhelp;
		});
	}

	static get testCoords() {
		const lillie = new Block(
			controller.level.numRows - 1,
			4,
			controller.level,
			Resource.getAsset(FADDER_IMAGES.values().next().value[0])
		);
		controller.canvasContainer.addEventListener('mousemove', e => {
			// Find nearest (ish) seat. Ugly, but works for testing.
			let currentRow = lillie.level.positions.findIndex(
				row => row.find(coords => coords !== null)[1] < e.offsetY
			);
			if (currentRow === -1)
				currentRow = lillie.level.numRows - 1;
			
			let currentColumn = lillie.level.positions[currentRow].findIndex(
				coords => coords !== null && coords[0] > e.offsetX
			);
			if (currentColumn === -1)
				currentColumn = lillie.level.positions[currentRow].length - 1;

			while (!lillie.level.isFree(currentRow, currentColumn)) {
				currentColumn = (currentColumn + 1) % lillie.level.positions[currentRow].length
			}
			lillie.row = currentRow;
			lillie.column = currentColumn;
		});
	}

	static get sendhelp() {
		const level = Controller.instance.level;
		for (const row of [0, 1]) {
			for (let col = 0; col < level.occupied[row].length; col++) {
				if (!level.occupied[row][col]) {
					const block = new Block(
						row,
						col,
						level,
						Resource.getAsset(FADDER_IMAGES.values().next().value[0])
					);
					level.occupied[block.row][block.column] = true;
					level.settledBlocks[block.row][block.column] = block;
					level.objective.onBlockSettled(block);
				}
			}
		}
		level.checkCompleteRows();
	}

	static get someBlock() {
		for (const rowOfBlocks of Controller.instance.level.settledBlocks) {
			for (const block of rowOfBlocks) {
				if (block !== null)
					return block;
			}
		}
	}

	/**
	 * Går vidare till nästa objective.
	 */
	static get nextLevel() {
		controller.level.onObjectiveCompleted()
	}
};
