const music = Resource.addAsset("audio/myrstacken.mp3", LoopableAudioWithTail);

class TetrisController extends Controller {

	static _STORAGE_PREFIX = "_te1ris";

	constructor() {
		super("gameboard", /*updateInterval=*/1/30, /*gridWidth=*/10, /*gridHeight=*/30);
		this.canvasContainer = document.getElementById("gameboardContainer");

		this.stateProperties = [];

		this.barHeight = 64;
		this.margin = 0;
	}

	startDrawLoop() {
		this.setCanvasDimensions(this.barHeight, this.margin, this.margin / 2);
		window.addEventListener("resize", () => this.setCanvasDimensions(this.barHeight, this.margin, this.margin / 2));
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
		let level = new Level();
		this.registerObject(level);
	}

	setupElements() {
		// Resumeknappen på paussidan
		document.getElementById("resumeButton").addEventListener("click", e => {
			this.togglePause();
			e.preventDefault();
		}, true);
		// Respawnknappen ("försök igen") på du dog-sidan
		document.getElementById("respawnButton").addEventListener("click", e => {
			this.objects.clear();
			this.delayedRenderObjects = [];
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
					this.objects.clear();
					this.delayedRenderObjects = [];
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

	onPlay() {
		super.onPlay();
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
};
