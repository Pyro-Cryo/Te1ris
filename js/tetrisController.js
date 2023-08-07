"use strict";

const music = Resource.addAsset("audio/myrstacken.mp3", LoopableAudioWithTail);
const REMOVE_ON_MODAL_CLOSE = 'removeOnModalClose';

class ModalButton {
	/**
	 * @param {string} label 
	 * @param {string} icon 
	 * @param {(e: Event) => void} onClick 
	 */
	constructor(label, icon, onClick) {
		this.label = label;
		this.icon = icon;
		this.onClick = onClick;
	}
}

class TogglableModalButton extends ModalButton {
	constructor(label, icon, onClick, clickedLabel, clickedIcon, onUnclick, startClicked = false) {
		super(label, icon, onClick);
		this.clickedLabel = clickedLabel;
		this.clickedIcon = clickedIcon;
		this.onUnclick = onUnclick;
		this.startClicked = startClicked;
	}
}

class BlockIntroduction {
	/**
	 * @param {typeof Block} BlockType 
	 * @param {string} blockName 
	 * @param {string} message 
	 */
	constructor(BlockType, blockName, message) {
		this.BlockType = BlockType;
		this.blockName = blockName;
		this.message = message;
	}

	getImage() {
		const level = Controller.instance.level;
		const [blockImage] = Shape.selectBlockImages([this.BlockType]);
		const block = new this.BlockType(0, Math.floor(level.numColumns / 2), level, blockImage);
		block.prerender();

		try {
			const canvas = document.createElement("canvas");
			canvas.width = 5 * block.imagecache.width;
			canvas.height = 1.5 * block.imagecache.height;
			const tempGameArea = new GameArea(canvas, null, null);
			block.drawPreview(tempGameArea);

			return canvas;
		} finally {
			block.despawn();
		}
	}
}

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
		this.modalElement = document.getElementById("modal");

		this.fadderFigureCounter = 1;
		this.hasSeenIntroduction = false;
		this.hasSeenBlockIntroduction = [];
		this.bestTotalTime = -1;
		this.bestScore = -1;
		this.stateProperties = ["hasSeenIntroduction", "hasSeenBlockIntroduction", "bestTotalTime", "bestScore"];
		this.level = null;
		this.touchControls = new TouchControls(
			/*element=*/this.gameArea.canvas,
			/*allowedElements=*/new Set([this.gameArea.canvas, document.documentElement]),
			/*onTap=*/(x, y) => {
				if (!this.level || !this.level.currentShape) return;
				if (y > document.documentElement.clientHeight / 2) {
					this.level.currentShape.fall(/*toBottom=*/false);
					this.level.moveTimer = Math.max(this.level.moveTimer, this.level.MOVE_TIME);
				} else if (x > document.documentElement.clientWidth / 2) {
					this.level.currentShape.rotateRight();
				} else {
					this.level.currentShape.rotateLeft();
				}
			},
			/*onSwipeDown=*/() => {
				if (!this.level || !this.level.currentShape) return;
				this.level.currentShape.fall(/*toBottom=*/true);
				this.level.moveTimer = Math.max(this.level.moveTimer, this.level.MOVE_TIME);
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
			},
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
			if (this.muteButton)
				this.muteButton.classList.add("hidden");
			if (this.unmuteButton)
				this.unmuteButton.classList.remove("hidden");
		}
		this.startDrawLoop();
		this.loadState();
		this.createLevel();
		this.setupElements();
		if (!this.hasSeenIntroduction)
			this.showIntroduction();
		else
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

	/**
	 * @param {ModalButton[]} buttons 
	 * @param {string | BlockIntroduction | null} message 
	 * @param {string} title 
	 */
	displayModal(buttons, message = null, title = "Pausat") {
		const titleElement = document.getElementById("modalTitle");
		const messageElement = document.getElementById("modalMessage");
		const buttonTemplate = document.getElementById("buttonTemplate");
		
		// Cleanup old buttons etc.
		for (const element of this.modalElement.querySelectorAll(`.${REMOVE_ON_MODAL_CLOSE}`)) {
			element.remove();
		}

		const createButton = (label, icon) => {
			const newButton = buttonTemplate.cloneNode(/*deep=*/true);
			newButton.removeAttribute("id");
			const [buttonLabel] = newButton.getElementsByClassName("buttonLabel");
			const [buttonIcon] = newButton.getElementsByClassName("buttonIcon");
			buttonLabel.innerText = label;
			buttonIcon.innerText = icon;
			this.modalElement.appendChild(newButton);
			newButton.classList.add(REMOVE_ON_MODAL_CLOSE);
			return newButton;
		};

		titleElement.innerText = title;
		if (message === null) {
			messageElement.classList.add('hidden');
		} else if (message instanceof BlockIntroduction) {
			const canvas = messageElement.insertAdjacentElement('beforebegin', message.getImage());
			canvas.classList.add(REMOVE_ON_MODAL_CLOSE);
			const caption = document.createElement('div');
			caption.innerText = `Fig. ${this.fadderFigureCounter++}: ${message.blockName}.`;
			messageElement.insertAdjacentElement('beforebegin', caption);
			caption.classList.add('caption');
			caption.classList.add(REMOVE_ON_MODAL_CLOSE);

			messageElement.innerText = message.message;
			messageElement.classList.remove('hidden');
		} else {
			messageElement.innerText = message;
			messageElement.classList.remove('hidden');
		}

		for (const button of buttons) {
			/** @type {HTMLButtonElement} */
			const buttonElement = createButton(button.label, button.icon);
			
			if (button instanceof TogglableModalButton) {
				const clickedButtonElement = createButton(button.clickedLabel, button.clickedIcon);

				buttonElement.addEventListener("click", e => {
					buttonElement.classList.add("hidden");
					clickedButtonElement.classList.remove("hidden");
					button.onClick(e);
				});
				clickedButtonElement.addEventListener("click", e => {
					clickedButtonElement.classList.add("hidden");
					buttonElement.classList.remove("hidden");
					button.onUnclick(e);
				});

				if (button.startClicked) {
					clickedButtonElement.classList.remove("hidden");
				} else {
					buttonElement.classList.remove("hidden");
				}
			} else {
				buttonElement.addEventListener("click", button.onClick);
				buttonElement.classList.remove("hidden");
			}
		}
		this.modalElement.classList.remove("hidden");
	}

	closeModal() {
		this.modalElement.classList.add("hidden");
		for (const element of this.modalElement.querySelectorAll(`.${REMOVE_ON_MODAL_CLOSE}`)) {
			element.remove();
		}
	}

	get isModalOpen() {
		return !this.modalElement.classList.contains("hidden");
	}

	createLevel() {
		this.level = new Level();
	}

	setupElements() {
		document.body.addEventListener("keydown", e => {
			if (e.code === "Escape") {
				if (!this.isPaused && !this.isModalOpen) {
					this.onPause();
					e.preventDefault();
				} else if (this.isModalOpen) {
					this.onPlay();
					e.preventDefault();
				}
			} else if (!this.isPaused) {
				this.level.onKeyDown(e);
			}
		}, true);
		setInterval(
			() => {
				if (this.level && this.level.score > this.bestScore) {
					const score = this.level.score;
					ScoreReporter.report(
						score,
						/*onSuccess=*/() => {
							Controller.instance.bestScore = score;
							Controller.instance.saveState();
							alert(`Rapporterade in ${score} poäng!`);
						},
					);
				}
			},
			SCORE_REPORTING_INTERVAL,
		);
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
			hasSeenIntroduction: false,
			hasSeenBlockIntroduction: [],
			bestTotalTime: -1,
			bestScore: -1,
		};
		let data = window.localStorage.getItem(this.STORAGE_PREFIX + "state");
		if (data)
			data = JSON.parse(data);
		else
			data = defaultState;
		
		for (const prop of this.stateProperties) {
			if (!data.hasOwnProperty(prop)) {
				console.warn(`Property ${prop} missing in saved state, using default ${defaultState[prop]}`);
				this[prop] = defaultState[prop];
			} else {
				this[prop] = data[prop];
			}
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
		this.closeModal();
		if (!this.currentMusic) {
			this.currentMusic = Resource.getAsset(music);
			this.currentMusic.currentTime = 0;
		}
		this.currentMusic.play();
	}

	onPause() {
		super.onPause();
		this.displayModal(
			/*buttons=*/[
				new ModalButton("Fortsätt", "\ue037", () => this.onPlay()),
				new ModalButton("Visa kontroller", "\uea28", () => this.showControls()),
				new TogglableModalButton(
					"Tysta musik",
					"\ue04f",
					() => this.onMute(),
					"Sätt på musik",
					"\ue050",
					() => this.onUnMute(),
					this.muted,
				)
			]
		);
		if (this.currentMusic)
			this.currentMusic.pause();
	}

	showControls(label = null, icon = null, onClick = null) {
		if (!this.isPaused) {
			super.onPause();
			if (this.currentMusic)
				this.currentMusic.pause();
		}
		label ??= "Fortsätt";
		icon ??= "\ue037";
		onClick ??= () => this.onPlay();
		let message;
		if ("ontouchstart" in document.documentElement) {
			// Förmodligen mobil - iallafall finns touchevent, och det gör de sällan på desktop.
			message = "Tryck eller dra på skärmen för att guida faddrarna rätt.\n- Tycker du snabbt längst ner på skärmen hoppar faddrarna direkt ner en rad.\n- Trycker du uppe till höger eller till vänster så roterar faddrarna.\n- Drar du i horisontell led så förflyttar de sig efter ditt finger.\n- Drar du nedåt så hoppar de direkt så långt ner i salen de kan.\n- Pausa genom att trycka på ikonen uppe till vänster.";
		} else {
			// Förmodligen desktop - vi vet visserligen inte att tangentbord finns, men det är inte vårt problem för touchkontroller fanns uppenbarligen ändå inte.
			message = "Använd tangentbordet för att guida faddrarna rätt.\n- Trycker du på nedåtpil eller S hoppar faddrarna direkt ner en rad.\n- Trycker du på uppåtpil eller E/Q så roterar faddrarna.\n- Trycker du på höger-/vänsterpil eller D/A förflyttar de sig i horisontell led.\n- Trycker du på mellanslag så hoppar de direkt så långt ner i salen de kan.\n- Pausa genom att trycka på ikonen uppe till vänster, eller Escape.";
		}
		this.displayModal(
			[new ModalButton(label, icon, onClick)],
			message,
			"Kontroller",
		);
	}

	showIntroduction() {
		super.onPause();
		const messages = [
			"Välkommen till TE1ris!\n\nDet är föreläsning i E1 och Fysikerna och Matematikerna börjar strömma in. Föreläsaren har lovat att ranka alla saker uppkallade efter Gauss i coolhetsordning och intresset är självklart rekordstort. Men kommer platserna räcka åt alla, eller blir det ståplats åt eftersläntrarna? Bara DU kan lösa detta packningsproblem (och du behöver inte ens ha läst Fastan)!",
			"Grupper med fyra faddrar åt gången kommer att gå in genom dörren och sätta sig längst bak. Finns det plats framför dem så flyttar de ner en rad, tillsammans. Gör det inte det så sätter de sig permanent, och sen kommer nästa grupp in.\n\nNär en rad blir full får salen ett kort besök av Föhseriet, som medelst sin ljungeldsblick vänligt (men bestämt) uppmanar faddrarna att byta aggregationstillstånd, så att fler ska få plats.",
			"Överst på skärmen finns det ett mål som du ska försöka uppfylla, t.ex. att hjälpa N grupper hitta en plats för något positivt heltal N. Lyckas du uppfylla dessa får du poäng!\n\nOm salen blir så full att nästa grupp faddrar inte får plats så är spelet över.",
		];

		const displayNext = () => {
			const [message] = messages.splice(0, 1);
			this.displayModal(
				[
					new ModalButton(
						"Nästa",
						"\ue5c8",
						() => {
							if (messages.length === 0) {
								this.hasSeenIntroduction = true;
								this.saveState();
								this.showControls("Börja", "\ue037");
							} else {
								displayNext();
							}
						},
					)
				],
				message,
				"TE1ris"
			);
		};
		displayNext();
		if (this.currentMusic)
			this.currentMusic.pause();
	}

	restart() {
		this.unregisterAllObjects();
		this.createLevel();
		this.currentMusic.currentTime = 0;
		this.onPlay();
	}

	showGameOver() {
		if (!this.isPaused) {
			super.onPause();
			if (this.currentMusic)
				this.currentMusic.pause();
		}
		const buttons = [
			new ModalButton("Spela igen", "\ue042", () => this.restart()),
		];
		const score = this.level.score;
		// TODO: Ta bort alert!
		ScoreReporter.report(score, /*onSuccess=*/() => alert(`Rapporterade in ${score} poäng!`));
		// Detta kanske kan klassas som BM, men det hjälper säkert någon.
		if (score < 100) {
			buttons.push(
				new ModalButton(
					"Visa kontroller",
					"\uea28",
					() => this.showControls(
						"Spela igen",
						"\ue042",
						() => this.restart(),
					),
				)
			);
		}
		this.displayModal(
			buttons,
			"Trots dina tappra försök att dirigera alla nyfikna faddrar får nästa grupp helt enkelt inte plats!\n\n"
			+ (score > 0 ? `Du lyckades samla ihop ${score} poäng!` : `Det blev tyvärr inga poäng den här gången :(`),
			"Åh nej!",
		);
	}

	/**
	 * @param {typeof Block} BlockType 
	 */
	showBlockIntroduction(BlockType) {
		let message, name;
		switch (BlockType) {
			case ConfusedBlock:
				name = "Förvirrad och vilsen fadder";
				message = "Förvirrade faddrar går efter ett litet tag, eftersom de egentligen skulle till en nummeföreläsning och råkat ta fel sal. Om de satt sig i mitten av en klunga kan det uppstå tomma platser som andra faddrar har svårt att nå.";
				break;
			case RudeBlock:
				name = "Dryg fadder";
				message = "Vissa faddrar är lite dryga och tänker inte på andra, och breder därför ut sig på sätena bredvid. Skulle sätet bredvid vara upptaget har de iallafall folkvett nog att inte lägga sakerna ovanpå bänkgrannen i fråga.";
				break;
			case SleepyBlock:
				name = "Sömnig fadder";
				message = "Många har någon gång nickat till under en föreläsning, men vissa faddrar har så rubbad dygnsrytm att huvuddelen av deras sömn fås till en föreläsares hypnotiserande stämma. Ser du en fadder med kudde kan du räkna med att de snart slumrar till, och då kanske de inte hänger med när övriga flyttar ner i salen.";
				break;
			case ShadedBlock:
				name = "Cool fadder";
				message = "Man kan vara cool utan solglasögon, men det är dumt att chansa. En del är så coola att de har på sig solglasögon inomhus. Somliga påstår att Föhseriet är så coola att de sover i solglasögon, andra att de inte sover överhuvudtaget. Säkert är iallafall att solglasögon skyddar mot Föhseriets ljungeldsblick, åtminstone en (1) gång.";
				break;
			default:
				console.error(`Det finns ingen introduktion för blocktyp ${BlockType.name}`)
				return;
		}
		super.onPause();
		this.displayModal(
			/*buttons=*/[
				new ModalButton("Fortsätt", "\ue037", () => {
					this.onPlay();
					if (this.hasSeenBlockIntroduction.indexOf(BlockType.name) === -1) {
						this.hasSeenBlockIntroduction.push(BlockType.name);
						this.saveState();
					}
				}),
			],
			new BlockIntroduction(BlockType, name, message),
			'Ny faddertyp'
		);
		if (this.currentMusic)
			this.currentMusic.pause();
	}

	showYouWon(totalTime) {
		if (!this.isPaused) {
			super.onPause();
			if (this.currentMusic)
				this.currentMusic.pause();
		}
		const buttons = [
			new ModalButton("Spela vidare", "\ue037", () => this.onPlay()),
			new ModalButton("Börja om", "\ue042", () => this.restart()),
		];
		let timeSentence;
		const formatTimestamp = milliseconds => {
			const parts = [];
			const MS_IN_MINUTE = 1000 * 60;
			const MS_IN_HOUR = MS_IN_MINUTE * 60;
			if (milliseconds > MS_IN_HOUR) {
				parts.push(Math.floor(milliseconds / MS_IN_HOUR));
				milliseconds -= parts[parts.length - 1] * MS_IN_HOUR;
			}
			parts.push(Math.floor(milliseconds / MS_IN_MINUTE));
			milliseconds -= parts[parts.length - 1] * MS_IN_MINUTE;
			parts.push(Math.floor(milliseconds / 1000));
			return parts.map(x => x < 10 ? `0${x}` : `${x}`).join(':');
		};
		if (this.bestTotalTime === -1 || this.bestTotalTime === undefined) {
			timeSentence = `Du klarade det på ${formatTimestamp(totalTime)}.`;
			this.bestTotalTime = totalTime;
			this.saveState();
		} else if (totalTime < this.bestTotalTime) {
			timeSentence = `Du klarade det på ${formatTimestamp(totalTime)}, vilket är nytt personbästa! Ditt tidigare var ${formatTimestamp(this.bestTotalTime)}.`;
			this.bestTotalTime = totalTime;
			this.saveState();
		} else {
			timeSentence = `Du klarade det på ${formatTimestamp(totalTime)} (men ditt personbästa är ${formatTimestamp(this.bestTotalTime)}).`;
		}
		const score = this.level.score;
		// TODO: Ta bort alert!
		ScoreReporter.report(score, /*onSuccess=*/() => alert(`Rapporterade in ${score} poäng!`));

		this.displayModal(
			buttons,
			`Aldrig tidigare har det gått in så många nyfikna studenter i en föreläsningssal. Du har samlat ihop ${score} poäng, vilket är det maximala! ${timeSentence}\n\nDu kan fortsätta spela med slumpmässiga mål, börja om från början för att försöka slå din rekordtid, eller passa på att skryta om hur bra du är på Tetris för någon du inte pratat med ännu.\n\nTack för att du spelade! :)`,
			"Grattis!",
		);
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
