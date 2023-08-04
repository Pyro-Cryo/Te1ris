"use strict";

const positions = [
	[
		null,
		null,
		null,
		null,
		[367,623],
		[458,642],
		[561,663],
		[662,659],
		[768,656],
		[865,644],
		[954,625],
		[1034,611],
		[1104,592],
		[1165,569],
		[1217,548],
		[1271,531],
	],
	[
		[174, 482],
		[224, 492],
		[282, 506],
		[345, 518],
		[419, 532],
		[494, 544],
		[575, 553],
		[660, 557],
		[749, 553],
		[831, 546],
		[906, 539],
		[977, 527],
		[1040, 517],
		[1095, 504],
		[1148, 492],
		[1195, 480],
	],
	[
		[233, 435],
		[280, 445],
		[332, 452],
		[390, 464],
		[454, 473],
		[524, 480],
		[594, 483],
		[663, 483],
		[737, 482],
		[806, 482],
		[869, 473],
		[932, 466],
		[994, 461],
		[1045, 456],
		[1092, 449],
		[1136, 440],
	],
	[
		[280, 395],
		[324, 405],
		[372, 409],
		[426, 416],
		[480, 419],
		[541, 424],
		[601, 426],
		[667, 426],
		[726, 426],
		[787, 424],
		[843, 417],
		[899, 417],
		[953, 414],
		[1005, 407],
		[1048, 405],
		[1088, 402],
	],
	[
		[317, 363],
		[360, 368],
		[404, 372],
		[453, 374],
		[503, 375],
		[554, 381],
		[609, 381],
		[665, 381],
		[719, 379],
		[773, 379],
		[824, 379],
		[876, 375],
		[923, 375],
		[968, 372],
		[1014, 370],
		[1050, 367],
	],
	[
		[350, 335],
		[388, 339],
		[432, 341],
		[475, 344],
		[519, 346],
		[568, 346],
		[615, 349],
		[662, 348],
		[714, 349],
		[763, 348],
		[810, 346],
		[855, 346],
		[899, 344],
		[939, 341],
		[980, 341],
		[1019, 339],
	],
	[
		[376, 314],
		[414, 316],
		[453, 318],
		[493, 320],
		[534, 320],
		[576, 321],
		[622, 325],
		[667, 323],
		[710, 323],
		[754, 321],
		[796, 321],
		[839, 320],
		[878, 320],
		[918, 318],
		[954, 320],
		[991, 316],
	],
	[
		[399, 293],
		[435, 297],
		[469, 298],
		[506, 300],
		[544, 302],
		[584, 302],
		[624, 302],
		[666, 302],
		[708, 302],
		[745, 301],
		[783, 300],
		[824, 302],
		[861, 299],
		[896, 300],
		[933, 299],
		[967, 301],
	],
	[
		[419, 275],
		[451, 276],
		[485, 279],
		[519, 279],
		[556, 279],
		[591, 280],
		[629, 280],
		[666, 281],
		[702, 283],
		[739, 279],
		[774, 279],
		[810, 281],
		[847, 279],
		[880, 279],
		[912, 279],
		[945, 278],
	],
	[
		[436, 257],
		[466, 258],
		[498, 258],
		[530, 259],
		[564, 258],
		[596, 259],
		[631, 261],
		[666, 261],
		[701, 262],
		[737, 261],
		[767, 259],
		[800, 258],
		[833, 258],
		[866, 259],
		[896, 259],
		[927, 262],
	],
	[
		[454, 241],
		[483, 241],
		[512, 242],
		[542, 243],
		[573, 241],
		[604, 242],
		[636, 243],
		[668, 243],
		[701, 243],
		[732, 244],
		[762, 243],
		[793, 242],
		[822, 243],
		[854, 243],
		[884, 243],
		[912, 244],
	],
	[
		null,
		null,
		[521, 228],
		[550, 228],
		[580, 227],
		[608, 227],
		[637, 229],
		[667, 229],
		[696, 229],
		[726, 230],
		[755, 228],
		[786, 228],
		[813, 229],
		[841, 228],
		null,
		null,
	],
	[
		null,
		null,
		[530, 214],
		[557, 214],
		[584, 214],
		[611, 214],
		[640, 214],
		[668, 215],
		[694, 214],
		[723, 214],
		[751, 214],
		[776, 214],
		[804, 215],
		[832, 215],
		null,
		null,
	],
	[
		null,
		null,
		[537, 206],
		[562, 205],
		[587, 206],
		[616, 205],
		null,
		null,
		null,
		null,
		[746, 206],
		[773, 207],
		[795, 205],
		[822, 207],
		null,
		null,
	],
	[
		null,
		null,
		[545, 191],
		[569, 192],
		[594, 191],
		[617, 191],
		null,
		null,
		null,
		null,
		[743, 191],
		[768, 191],
		[793, 192],
		[817, 193],
		null,
		null,
	]
];
const rowWithDoor = positions.findIndex(cols => cols[cols.length - 1] === null);
const background = Resource.addAsset("img/fisheye/background-1440.jpg");
const rowImages = positions.map(
	(_, row) => Resource.addAsset(`img/fisheye/${row}.png`)
);
// Center positions for the row images to align them with the background.
const rowPositions = [
	[807, 660],
	[688, 624],
	[682, 525],
	[687, 463],
	[684, 415],
	[683, 376],
	[684, 345],
	[684, 320],
	[683, 298],
	[682, 277],
	[682, 258],
	[682, 242],
	[681, 228],
	[680, 215],
	[680, 199],
];
const ZAPPING_BLOCKS_REMOVED_TIME = 1000;
const ZAPPING_TOTAL_ANIMATION_TIME = 1500;
const AISLE_LEFT = 'AISLE_LEFT';
const AISLE_RIGHT = 'AISLE_RIGHT';

class Row extends GameObject {
	constructor(index, scale) {
		super(
			/*x=*/rowPositions[index][0],
			/*y=*/rowPositions[index][1],
			/*image=*/Resource.getAsset(rowImages[index]),
			/*angle=*/0,
			/*scale=*/scale,
			/*register=*/false,
		);
		Controller.instance.registerObject(this, /*layer=*/2 + positions.length - index);
	}
};

class Level extends GameObject {

	static get image() { return Resource.getAsset(background); }
	get imageWidth() { return 1440; }
	get imageHeight() { return 789; }

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

		const lastRow = this.positions[this.numRows - 1];
		const firstColumnInLastRow = lastRow.findIndex(pos => pos !== null);
		// Used in computing the block scale.
		this.distanceLastRow = lastRow[firstColumnInLastRow + 1][0] - lastRow[firstColumnInLastRow][0];

		this.spawningPosition = [this.numRows - 1, firstColumnInLastRow + 1];
		/** @type {?Shape} */
		this.currentShape = null;
		this.objective = new ClearNRowsObjective(this, 1);
		this.spawnShape();
		this.MOVE_TIME = 2000;
		this.moveTimer = 2000;

		this.CHECK_COMPLETE_ROWS_TIME = 1000;
		this.checkCompleteRowsTimer = -1;
		this.zapTimeout = null;

		document.body.addEventListener("keydown", this.onKeyDown.bind(this));
	}

	update(delta) {
		super.update(delta);
		this.moveTimer -= delta;
		if (this.moveTimer < 0) {
			this.moveTimer += this.MOVE_TIME;
			if (this.currentShape !== null) {
				this.currentShape.fall(/*toBottom=*/false);
			}
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
				this.moveTimer = Math.max(this.moveTimer, this.MOVE_TIME);
				break;

			case 'ArrowDown':
			case 'KeyS':
			case 'Numpad2':
				this.currentShape.fall(/*toBottom=*/false);
				this.moveTimer = Math.max(this.moveTimer, this.MOVE_TIME);
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

	/**
	 * Finds the column index of an aisle, returning actual column indices as-is.
	 * @param {number} row 
	 * @param {number | string} columnOrAisle 
	 * @returns {number}
	 */
	_aisleToColumn(row, columnOrAisle) {
		switch (columnOrAisle) {
			case AISLE_LEFT:
				// There are four null seats to the left of the front row. On other rows,
				// the aisle is the column just outside a valid seat.
				if (row === 0)
					return -1;
				return this.positions[row].findIndex(pos => pos !== null) - 1;
			case AISLE_RIGHT:
				return this.positions[row].findLastIndex(pos => pos !== null) + 1;
			default:
				return columnOrAisle;
		}
	}

	/**
	 * Extrapolates outside the grid of valid positions to find reasonable positions for missing seats and aisles.
	 * @param {number} row 
	 * @param {number | string} column
	 * @returns {number[]} Position [x, y] of the indicated row and column.
	 */
	extrapolatePositionOutsideMap(row, column) {
		if (!(row >= 0 && row < this.numRows)) {
			throw new Error(`Invalid row: ${row}`);
		}
			
		const step = column < this.numColumns / 2 ? 1 : -1;
		let columnInMap = column + step;
		let numSteps = 1;
		while (columnInMap < 0 || columnInMap >= this.numColumns || this.positions[row][columnInMap] === null) {
			columnInMap += step;
			numSteps++;
		}
		return Splines.extrapolate(
			this.positions[row][columnInMap + step],
			this.positions[row][columnInMap],
			/*backwards=*/false,
			numSteps,
		);
	}

	/**
	 * Gets the positions that a block could walk to in the grid without passing through other blocks.
	 * @param {number} row The origin row index.
	 * @param {number | string} columnOrAisle The origin column index, or a special value AISLE_LEFT or AISLE_RIGHT.
	 */
	backtrackingMatrixFrom(row, columnOrAisle) {
		const numColumnsPlus2 = this.numColumns + 2;
		const minColumnByRow = new Array(this.numRows).fill(0).map((_, r) => this._aisleToColumn(r, AISLE_LEFT));
		const maxColumnByRow = new Array(this.numRows).fill(0).map((_, r) => this._aisleToColumn(r, AISLE_RIGHT));
		// Make sure blocks can move between the outer (downwards) and inner (uppwards) aisle on the row with the door.
		minColumnByRow[rowWithDoor] = minColumnByRow[rowWithDoor - 1];
		maxColumnByRow[rowWithDoor] = maxColumnByRow[rowWithDoor - 1];

		const isFreeOrValidOutside = (r, c) => (
			r >= 0
			&& r < this.numRows
			&& c >= minColumnByRow[r]
			&& c <= maxColumnByRow[r]
			&& (!this.isInMap(r, c) || !this.occupied[r][c])
		);

		// JS does not have tuples, so we need to encode both coordinates in one value to use it in sets.
		function toSingleIndex(r, c) {
			return r * numColumnsPlus2 + c + 1;
		}

		function fromSingleIndex(index) {
			const c = (index % numColumnsPlus2) - 1;
			return [(index - c - 1) / numColumnsPlus2, c];
		}

		// Matrix containing the coordinates of the tile that should be visited before the indexed one.
		// Null means unreachable or starting position.
		const previous = new Array(this.numRows).fill(null).map(_ => new Array(numColumnsPlus2).fill(null));
		// The tiles whose neighbors have been added to the checking set, and should not be checked again.
		// Not 100% sure this is actually necessary, `previous` is sort of also used for this purpose.
		const visited = new Array(this.numRows * numColumnsPlus2).fill(false);
		const startIndex = toSingleIndex(row, this._aisleToColumn(row, columnOrAisle));

		const toCheck = new Set([startIndex]);
		for (const currentIndex of toCheck) {
			if (visited[currentIndex]) continue;
			visited[currentIndex] = true;
			const [currentRow, currentColumn] = fromSingleIndex(currentIndex);
			const neighbors = [
				[currentRow, currentColumn - 1],
				[currentRow, currentColumn + 1],
				[currentRow - 1, currentColumn],
				[currentRow + 1, currentColumn]
			];

			for (const [neighborRow, neighborColumn] of neighbors) {
				const neighborSingleIndex = toSingleIndex(neighborRow, neighborColumn);
				if (
					!isFreeOrValidOutside(neighborRow, neighborColumn)  // Skip blocked or out of bounds.
					|| visited[neighborSingleIndex]  // Skip already visited tiles.
					|| previous[neighborRow][neighborColumn + 1] !== null  // Skip tiles with shorter paths.
				)
					continue;
				previous[neighborRow][neighborColumn + 1] = [currentRow, currentColumn];
				toCheck.add(neighborSingleIndex);
			}
		}

		return previous;
	}

	isReachableInBacktrackingMatrix(row, aisleOrColumn, previous) {
		return previous[row][this._aisleToColumn(row, aisleOrColumn) + 1] !== null;
	}

	/**
	 * Gets a path to a row and column coordinate pair from the origin of the backtracking map.
	 * @param {number} row The destination row to backtrack from.
	 * @param {number[]} aisleOrColumn The destination column to backtrack from.
	 * @param {number[][][]} previous The array of arrays that describe shortest paths, as provided by Level.backtrackingMatrixFrom().
	 * @returns {number[][]} A path in row and column coordinates, which may go outside the map.
	 */
	backtrackFrom(row, aisleOrColumn, previous) {
		const column = this._aisleToColumn(row, aisleOrColumn);
		const result = [];
		for (let current = [row, column]; current !== null; current = previous[current[0]][current[1] + 1]) {
			result.push(current);
		}
		return result.reverse();
	}

	/**
	 * Converts a path of [row, column] coordinates to [x, y, scale] coordinates.
	 * @param {number[][]} path 
	 * @returns {number[][]}
	 */
	rowColumnPathToPositionScaleCoordinates(path) {
		return path.map(pos => {
			const [row, column] = pos;
			if (this.isInMap(row, column)) {
				const [x, y] = this.positions[row][column];
				return [x, y, this.getScale(row, column)];
			}
			const coordsAndScale = this.extrapolatePositionOutsideMap(row, column);
			coordsAndScale.push(this.getScale(row));
			return coordsAndScale;
		});
	}

	simplePathBetween(startRow, startColumnOrAisle, destinationRow, destinationColumnOrAisle) {
		const minColumnByRow = new Array(this.numRows).fill(0).map((_, r) => this._aisleToColumn(r, AISLE_LEFT));
		const maxColumnByRow = new Array(this.numRows).fill(0).map((_, r) => this._aisleToColumn(r, AISLE_RIGHT));
		// Make sure blocks can move between the outer (downwards) and inner (uppwards) aisle on the row with the door.
		minColumnByRow[rowWithDoor] = minColumnByRow[rowWithDoor - 1];
		maxColumnByRow[rowWithDoor] = maxColumnByRow[rowWithDoor - 1];
		const startColumn = this._aisleToColumn(startRow, startColumnOrAisle);
		const destinationColumn = this._aisleToColumn(destinationRow, destinationColumnOrAisle);


		const path = [];
		let currentRow = startRow;
		let currentColumn = startColumn;
		while (true) {
			path.push([currentRow, currentColumn]);

			if (currentRow === destinationRow) {
				// In correct row, move towards target.
				if (currentColumn === destinationColumn) break;
				currentColumn += Math.sign(destinationColumn - currentColumn);
			} else if (currentColumn === minColumnByRow[currentRow] || currentColumn === maxColumnByRow[currentRow]) {
				// In an aisle column, move up/down.
				const nextRow = currentRow + Math.sign(destinationRow - currentRow);
				// If moving would put us outside the aisles, move back to them before changing row.
				while (currentColumn < minColumnByRow[nextRow]) {
					path.push([currentRow, currentColumn++]);
				}
				while (currentColumn > maxColumnByRow[nextRow]) {
					path.push([currentRow, currentColumn--]);
				}
				currentRow = nextRow;
			} else {
				// Not on the correct row or in an aisle column. Move to the nearest aisle column.
				if (currentColumn - minColumnByRow[currentRow] < maxColumnByRow[currentRow] - currentColumn) {
					// Minimum column (left aisle) is nearer.
					currentColumn--;
				} else {
					// Maximum column (right aisle) is nearer.
					currentColumn++;
				}
			}
		}
		return path;
	}

	/**
	 * Gets the scale multiplier for rendering an object at a certain position in
	 * the lecture hall.
	 * @param {number} row The row at which the object is located, starting with 0 at the bottom.
	 * @param {number} column The column at which the object is located, starting with 0 to the left. If not specified, the rightmost column in the row is used.
	 * @returns The scale multiplier.
	 */
	getScale(row, column = null) {
		if (column === null) {
			for (let col = this.numColumns - 1; col >= 0; col--) {
				if (this.isInMap(row, col)) {
					column = col;
					break;
				}
			}
		}
		if (!this.isInMap(row, column))
			throw new Error(`Invalid position: row ${row}, column ${column}`);

		const [x, y] = this.positions[row][column];
		let x2, y2;
		if (this.isInMap(row, column + 1)) {
			[x2, y2] = this.positions[row][column + 1];
		} else {
			[x2, y2] = this.positions[row][column - 1];
		}
		x2 -= x;
		y2 -= y;
		const distance = Math.sqrt(x2 * x2 + y2 * y2);
		return distance / this.distanceLastRow;
	}

	spawnShape() {
		let setCurrentShape = true;
		const spawned = this.objective.spawnShape(
			/*row=*/this.spawningPosition[0],
			/*column=*/this.spawningPosition[1],
			/*onCannotCreate=*/() => {
				this.currentShape = null;
				setCurrentShape = false;
				ScoreReporter.report(0, /*onSuccess=*/() => alert('Rapporterade in poäng!'));
				console.log('Game over!');
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
		// Let the current zapping complete before checking again.
		if (this.zapTimeout !== null)
			return;

		const completed_rows = this.getCompleteRows();
		// Animate the zapping of the blocks.
		Fohs.zapRows(completed_rows);

		// Zap and move blocks after a timeout so that the animation looks reasonable.
		this.zapTimeout = setTimeout(
			() => {
				this.zapTimeout = null;
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
			},
			ZAPPING_BLOCKS_REMOVED_TIME,
		);
	}

	onSettle() {
		for (const block of this.currentShape.blocks) {
			this.occupied[block.row][block.column] = true;
			this.settledBlocks[block.row][block.column] = block;
		}
		for (const block of this.currentShape.blocks) {
			block.onSettle();
			this.objective.onBlockSettled(block);
		}
		this.objective.onShapeSettled(this.currentShape);
		this.currentShape.blocks = [];
		this.currentShape.despawn();
		this.checkCompleteRows();
		this.spawnShape();
	}

	onObjectiveCompleted() {
		// TODO: Välja level i nån kul ordning.
		switch (Math.floor(Math.random() * 8)) {
			case 0:
				this.objective = new ClearNRowsObjective(
					this, Math.floor(Math.random() * 3) + 2);
				break;

			case 1:
				this.objective = new ZapNBlocksObjective(
					this, Math.floor(Math.random() * 4 + 2) * 5);
				break;

			case 2:
				this.objective = new SettleNShapes(
					this, Math.floor(Math.random() * 4 + 2) * 5);
				break;

			case 3:
				this.objective = new SettleNShapes(
					this,
					Math.floor(Math.random() * 4 + 2),
				 	/*shapeTypeRestriction=*/SHAPES[Math.floor(Math.random() * SHAPES.length)]
				);
				break;

			case 4:
				this.objective = new ZapNShadedBlocksObjective(
					this, Math.floor(Math.random() * 4 + 2));
				break;

			case 5:
				this.objective = new SettleNShapesWithConfusedBlocks(
					this, Math.floor(Math.random() * 4 + 2));
				break;

			case 6:
				this.objective = new ZapNSleepingBlocksObjective(
					this, Math.floor(Math.random() * 4 + 2));
				break;

			case 7:
				this.objective = new ZapNRudeBlocksObjective(
					this, Math.floor(Math.random() * 4 + 2));
				break;
		}
	}
}
