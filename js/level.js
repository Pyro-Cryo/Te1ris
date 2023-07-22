"use strict";

const positions = [
	[
		null,
		null,
		null,
		null,
		[250, 507],
		[322, 506],
		[396, 508],
		[468, 506],
		[539, 502],
		[612, 509],
		[683, 510],
		[756, 508],
		[827, 507],
		[896, 504],
		[968, 505],
		[1030, 502],
	],
	[
		[67, 467],
		[128, 466],
		[185, 467],
		[242, 464],
		[302, 463],
		[358, 462],
		[416, 463],
		[475, 465],
		[535, 463],
		[592, 464],
		[649, 464],
		[706, 464],
		[763, 464],
		[820, 465],
		[878, 465],
		[933, 462],
	],
	[
		[142, 437],
		[191, 437],
		[242, 436],
		[288, 436],
		[336, 437],
		[384, 438],
		[432, 438],
		[480, 439],
		[531, 439],
		[578, 438],
		[625, 440],
		[674, 439],
		[720, 437],
		[768, 439],
		[815, 438],
		[864, 438],
	],
	[
		[197, 414],
		[239, 414],
		[280, 414],
		[321, 414],
		[363, 415],
		[404, 415],
		[446, 414],
		[486, 414],
		[528, 415],
		[569, 415],
		[609, 415],
		[650, 415],
		[691, 415],
		[731, 414],
		[772, 415],
		[813, 415],
	],
	[
		[236, 398],
		[274, 400],
		[311, 399],
		[347, 400],
		[382, 401],
		[418, 400],
		[454, 401],
		[488, 401],
		[526, 401],
		[562, 400],
		[597, 401],
		[633, 401],
		[668, 401],
		[704, 401],
		[739, 401],
		[774, 401],
	],
	[
		[268, 387],
		[300, 387],
		[332, 387],
		[364, 387],
		[396, 387],
		[428, 387],
		[460, 388],
		[492, 388],
		[524, 388],
		[556, 388],
		[587, 388],
		[620, 388],
		[651, 389],
		[682, 388],
		[714, 389],
		[745, 389],
	],
	[
		[293, 377],
		[322, 377],
		[350, 378],
		[379, 378],
		[408, 379],
		[435, 379],
		[465, 379],
		[495, 379],
		[523, 380],
		[551, 380],
		[580, 380],
		[609, 380],
		[637, 379],
		[666, 379],
		[694, 380],
		[721, 380],
	],
	[
		[312, 370],
		[339, 371],
		[365, 371],
		[390, 371],
		[416, 371],
		[444, 371],
		[469, 372],
		[496, 371],
		[521, 372],
		[548, 372],
		[575, 372],
		[600, 373],
		[626, 372],
		[652, 373],
		[677, 373],
		[703, 373],
	],
	[
		[329, 363],
		[353, 363],
		[377, 363],
		[400, 363],
		[424, 363],
		[449, 364],
		[472, 364],
		[496, 364],
		[520, 364],
		[544, 365],
		[569, 364],
		[593, 365],
		[616, 364],
		[640, 365],
		[664, 366],
		[688, 365],
	],
	[
		[344, 357],
		[366, 357],
		[390, 359],
		[409, 357],
		[431, 357],
		[455, 357],
		[476, 358],
		[498, 358],
		[521, 358],
		[542, 359],
		[565, 358],
		[586, 359],
		[608, 359],
		[629, 359],
		[652, 359],
		[674, 358],
	],
	[
		[356, 352],
		[376, 352],
		[397, 352],
		[417, 353],
		[437, 353],
		[458, 353],
		[477, 353],
		[499, 353],
		[518, 353],
		[541, 354],
		[561, 354],
		[582, 354],
		[602, 354],
		[621, 354],
		[643, 353],
		[661, 354],
	],
	[
		null,
		null,
		[405, 348],
		[423, 348],
		[442, 348],
		[462, 348],
		[481, 348],
		[499, 348],
		[519, 348],
		[538, 348],
		[557, 348],
		[577, 349],
		[596, 348],
		[614, 349],
		null,
		null,
	],
	[
		null,
		null,
		[410, 343],
		[428, 343],
		[447, 342],
		[464, 343],
		[482, 343],
		[501, 343],
		[518, 343],
		[537, 343],
		[555, 343],
		[572, 344],
		[589, 344],
		[608, 344],
		null,
		null,
	],
	[
		null,
		null,
		[417, 338],
		[433, 339],
		[450, 338],
		[468, 338],
		null,
		null,
		null,
		null,
		[551, 339],
		[569, 339],
		[586, 340],
		[602, 340],
		null,
		null,
	]
];
const background = Resource.addAsset("img/E1-1024px.jpg");
const rowImages = positions.map(
	(_, row) => Resource.addAsset(`img/rows/${row}.png`)
);

class Row extends GameObject {
	constructor(index, scale) {
		super(
			/*x=*/Controller.instance.gameArea.width / 2,
			// Correct y position is set below.
			/*y=*/0,
			/*image=*/Resource.getAsset(rowImages[index]),
			/*angle=*/0,
			/*scale=*/scale,
			/*register=*/false,
		);
		this.y = Controller.instance.gameArea.height - this.height / 2;
		Controller.instance.registerObject(this, /*layer=*/2 + positions.length - index);
	}
};

class Level extends GameObject {

	static get image() { return Resource.getAsset(background); }
	get imageWidth() { return 1024; }
	get imageHeight() { return 683; }

	constructor() {
		super(
			Controller.instance.gameArea.width / 2,
			Controller.instance.gameArea.height / 2,
		);
		this.scale = Math.min(
			Controller.instance.gameArea.width / this.imageWidth,
			Controller.instance.gameArea.height / this.imageHeight,
		);
		// Create the row objects to be drawn in between blocks at different rows.
		positions.map((_, row) => new Row(row, this.scale));
		// Make sure the level object, which defines the background, is drawn first.
		this.row = positions.length;

		this.positions = positions;
		this.numRows = this.positions.length;
		this.numColumns = positions[0].length;
		if (!this.positions.every(row => row.length == this.numColumns)) {
			throw new Error(`Expected all rows to have ${this.numColumns} columns in the positions array`);
		}
		this.occupied = positions.map(row => row.map(pos => pos === null));
		this.settledBlocks = positions.map(row => row.map(_ => null));

		// Setup scaling parameters.
		const firstRow = this.positions[0];
		const firstColumnInFirstRow = firstRow.findIndex(pos => pos !== null);
		this.distanceFirstRow = firstRow[firstColumnInFirstRow + 1][0] - firstRow[firstColumnInFirstRow][0];

		const lastRow = this.positions[this.numRows - 1];
		const firstColumnInLastRow = lastRow.findIndex(pos => pos !== null);
		this.distanceLastRow = lastRow[firstColumnInLastRow + 1][0] - lastRow[firstColumnInLastRow][0];

		this.spawningPosition = [this.numRows - 1, firstColumnInLastRow + 1];
		this.currentShape = null;
		this.objective = new ClearNRowsObjective(this, 1);
		this.spawnShape();
		this.MOVE_TIME = 2000;
		this.moveTimer = 2000;

		this.CHECK_COMPLETE_ROWS_TIME = 1000;
		this.checkCompleteRowsTimer = -1;

		document.body.addEventListener("keydown", this.onKeyDown.bind(this));
	}

	update(delta) {
		super.update(delta);
		this.moveTimer -= delta;
		if (this.moveTimer < 0) {
			this.moveTimer += this.MOVE_TIME;
			this.currentShape.fall(/*toBottom=*/false);
		}
		if (this.checkCompleteRowsTimer >= 0) {
			this.checkCompleteRowsTimer -= delta;
			if (this.checkCompleteRowsTimer < 0) {
				this.checkCompleteRows();
			}
		}
	}

	onKeyDown(event) {
		if (this.currentShape === null)
			return;

		switch (event.code) {
			case 'ArrowRight':
			case 'KeyD':
			case 'Numpad6':
				this.currentShape.moveRight();
				break;

			case 'ArrowLeft':
			case 'KeyA':
			case 'Numpad4':
				this.currentShape.moveLeft();
				break;

			case 'Space':
			case 'Numpad8':
				this.currentShape.fall(/*toBottom=*/true);
				break;

			case 'ArrowDown':
			case 'KeyS':
			case 'Numpad2':
				this.currentShape.fall(/*toBottom=*/false);
				break;

			case 'ArrowUp':
			case 'KeyW':
			case 'KeyE':
			case 'KeyX':
			case 'Numpad1':
			case 'Numpad5':
			case 'Numpad9':
				this.currentShape.rotateRight();
				break;

			case 'KeyQ':
			case 'KeyZ':
			case 'Numpad3':
			case 'Numpad7':
				this.currentShape.rotateLeft();
				break;
		}
	}

	isFree(row, column) {
		return this.isInMap(row, column) && !this.occupied[row][column];
	}

	isInMap(row, column) {
		return row >= 0
			&& row < this.numRows
			&& column >= 0
			&& column < this.numColumns
			&& this.positions[row][column] !== null;
	}

	getScale(row) {
		const t = row / (this.numRows - 1);
		return (1 - t) * this.distanceFirstRow / this.distanceLastRow + t;
	}

	spawnShape() {
		let setCurrentShape = true;
		const spawned = this.objective.spawnShape(
			/*row=*/this.spawningPosition[0],
			/*column=*/this.spawningPosition[1],
			/*onCannotCreate=*/() => {
				this.currentShape = null;
				setCurrentShape = false;
				alert('game over');
			},
		);

		if (setCurrentShape) {
			this.currentShape = spawned;
		}
	}

	/**
	 * Check all rows to see if any are completed. 
	 * @returns a list of the row indices that are considered complete. 
	 */
	getCompleteRows() {
		const complete_rows = [];
		// Check all rows before having them fall, since they could otherwise
		// fall in a way that makes them no longer clear.
		for (let rowToCheck = 0; rowToCheck < this.numRows; rowToCheck++) {
			if (this.occupied[rowToCheck].every(x => x)) {
				complete_rows.push(rowToCheck);
			}
		}
		return complete_rows;
	}

	/**
	 * Zaps the blocks in a row and returns a list of the ones that are now free.
	 * @param {number} row_index Index of the row to zap.
	 * @returns List of column indices that where actually cleared.
	 */
	zapCompletedRow(row_index) {
		const cleared_columns = []
		for (let column = 0; column < this.numColumns; column++) {
			// Seats that are missing are considered occupied, so
			// only clear the ones that have a block.
			const block = this.settledBlocks[row_index][column];
			if (block !== null) {
				if (block.onZapped()) {
					cleared_columns.push(column);
				}
				this.objective.onBlockZapped(block);
			}
		}
		return cleared_columns;
	}

	/**
	 * Trigger blocks in the given row and columns to fall down.
	 * @param {number} row_index The row to update.
	 * @param {number[]} columns List of column indices to update.
	 * @returns A list of column indices for the blocks that were moved.
	 */
	triggerFalldown(row_index, columns) {
		let updated_indices = [];
		for (const column of columns) {
			const block = this.settledBlocks[row_index][column];
			if (block === null || block.falldown()) {
				// If there is no block in this column on this row,
				// or if the block moves,
				// propagate the updates to the row above.
				updated_indices.push(column);
			}
		}

		return updated_indices;
	}

	/**
	 * Checks for completed rows and triggers block updates for any blocks that
	 * are affected by a zapped or moved row.
	 * @returns Nothing.
	 */
	checkCompleteRows() {
		const completed_rows = this.getCompleteRows();

		// Perform all zappings before any falldowns to ensure blocks are deleted properly.
		const updated_columns_by_row = new Map();
		for (const row of completed_rows) {
			updated_columns_by_row.set(row, this.zapCompletedRow(row));
			this.objective.onRowCleared(row);
		}

		// Perform falldowns from the bottom up, starting from each completed row in reverse order.
		for (const initialRow of completed_rows.reverse()) {
			let updated_columns = updated_columns_by_row.get(initialRow);
			for (let row = initialRow + 1; row < this.numRows; row++) {
				if (updated_columns.length === 0) break;
				updated_columns = this.triggerFalldown(row, updated_columns);
			}
		}

		// If any blocks have moved due to the clearing, new rows may have filled.
		// Schedule a new check in a little while (instead of checking it again
		// directly) so that the user can see what happens.
		if (completed_rows.length > 0 && this.checkCompleteRowsTimer < 0)
			this.checkCompleteRowsTimer = this.CHECK_COMPLETE_ROWS_TIME;
	}

	onSettle() {
		// console.log('Shape settled');
		for (const block of this.currentShape.blocks) {
			this.occupied[block.row][block.column] = true;
			this.settledBlocks[block.row][block.column] = block;
			this.objective.onBlockSettled(block);
		}
		this.objective.onShapeSettled(this.currentShape);
		this.currentShape.blocks = [];
		this.currentShape.despawn();
		this.checkCompleteRows();
		this.spawnShape();
	}

	onObjectiveCompleted() {
		switch (Math.floor(Math.random() * 4)) {
			case 0:
				this.objective = new ClearNRowsObjective(this, Math.floor(Math.random() * 3) + 2);
				break;

			case 1:
				this.objective = new ZapNBlocksObjective(this, Math.floor(Math.random() * 4 + 2) * 5);
				break;

			case 2:
				this.objective = new SettleNShapes(this, Math.floor(Math.random() * 4 + 2) * 5);
				break;

			case 3:
				this.objective = new SettleNShapes(
					this,
					Math.floor(Math.random() * 4 + 2),
				 	/*shapeTypeRestriction=*/SHAPES[Math.floor(Math.random() * SHAPES.length)]
				);
				break;
		}
	}
}