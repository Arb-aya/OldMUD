/**
 * This file is responsible for displaying the inventory to the user
 * as well as managing user interactions with the inventory
 */

//Data on character items from backend
let item_data;

let character_inventory_size;

//Prefix we need to access item images
let media_url;

// Do we initially display the grid horizontally or vertically
let initial_direction;

document.addEventListener('DOMContentLoaded', (e) => {
	// Load in data from backend. Passed via json_script filter.
	item_data = JSON.parse(document.getElementById('itemdata').textContent);
	character_inventory_size = Number(JSON.parse(document.getElementById('inventory_size').textContent));
	media_url = JSON.parse(document.getElementById('media_url').textContent);

	initial_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';

	display_inventory(initial_direction);
});


// If the window resizes we need to check if we want to change to a horizontal / vertical grid
window.addEventListener('resize', (e) => {

	// Only redraw the grid if it changes from horizontal to vertical or vice versa
	let new_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';
	if (new_direction !== initial_direction) {
		initial_direction = new_direction;
		display_inventory(new_direction);
	}
});


/**
 * Used to detect if we are on a bootstrap "small" breakpoint.
 * Checks to see if the element 'breakpoint-detect' which as d-md-none
 * as a class is displayed.
 *
 */
function is_small_breakpoint() {
	let element = document.getElementById('breakpoint-detect');
	return window.getComputedStyle(element).display === 'block';
}


function block_inventory_space(col, row, width, height, Layer) {
	const blocked_space = new Konva.Rect({
		x: col * GRID_CELL_SIZE,
		y: row * GRID_CELL_SIZE,
		width: width * GRID_CELL_SIZE,
		height: height * GRID_CELL_SIZE,
		fill: 'red',
		opacity: 0.5
	});

	return blocked_space;
}

/**
 * Creates a Konva canvas with a grid. User items are displayed
 * in the grid, the user can drag and drop the items into
 * different slots
 *
 * @param {String} type - horizontal / vertical menu
 */
function create_stage_wrapper(type = 'horizontal') {

	let stage_wrapper = {};
	const GRID_CELL_SIZE = 100;


	// Work out how many slots to display
	let display_size = character_inventory_size;

	if (character_inventory_size % 2 !== 0) {
		display_size = character_inventory_size + 1;
	}


	// Do we display them vertically or horizontally
	let cols = display_size / 2;
	let rows = 2;

	if (type === "vertical") {
		cols = 2;
		rows = display_size / 2;
	}


	const width = cols * GRID_CELL_SIZE;
	const height = rows * GRID_CELL_SIZE;



	var stage = new Konva.Stage({
		container: 'inventory',
		width: width,
		height: height
	});

	stage_wrapper.cols = cols;
	stage_wrapper.rows = rows;
	stage_wrapper.grid_cell_size = GRID_CELL_SIZE;
	stage_wrapper.stage = stage;

	return stage_wrapper;
}

/**
 * Draws a grid of rows and columns to make cells of grid_cell_size
 *
 * @param {Number} rows                                             - Number of rows to have
 * @param {Number} cols                                             - Number of columns to have
 * @param {Number} grid_cell_size                                   - Size of one grid square
 * @param {Number} width                                            - Maximum width of the stage to draw on
 * @param {Number} height                                           - Maximum height of the stage to draw on
 */
function create_grid_layer(rows, cols, grid_cell_size, width, height) {
	var grid_layer = new Konva.Layer();

	for (var i = 0; i <= cols; i++) {
		grid_layer.add(new Konva.Line({
			points: [Math.round(i * grid_cell_size), 0, Math.round(i * grid_cell_size), height],
			stroke: '#ddd',
			strokewidth: 1,
		}));
	}

	grid_layer.add(new Konva.Line({ points: [0, 0, 10, 10] }));
	for (var j = 0; j <= rows; j++) {
		grid_layer.add(new Konva.Line({
			points: [0, Math.round(j * grid_cell_size), width, Math.round(j * grid_cell_size)],
			stroke: '#ddd',
			strokewidth: 1,
		}));
	}

	return grid_layer;
}


/**
 * Creates a new image object per item passed in from the backend.
 * Wraps a Konva image object to provide attributes meant to make
 * collision detection easier.
 *
 * @param {String} name              - Name of the item
 * @param {Number} col               - Which column do we place the item in?
 * @param {Number} row               - Which row do we place the item in?
 * @param {Number} width             - How many "cells" does the item occupy on the X axis
 * @param {Number} height            - How many "cells" does the item occupy on the Y axis
 * @param {String} url               - URL to the image for the item
 * @param {Number} grid_cell_size    - The size of one grid cell in pixels
 * @param {Konva Layer Object} layer - Layer the image should be added to
 * @param {Konva Stage Objet} stage  - Stage @layer belonds to
 */
function newItem(name, col, row, width, height, url, grid_cell_size, layer, stage) {

	// Object returned from this method
	let item = {};

	// Space IDs are IDs that describe one cell in the grid. For example, 00 is the first cell (top left).
	// We keep track of the last space occupied by an item as well as the current one.
	item.lastSpaceID = col + "" + row;
	item.currentSpaceID = col + "" + row;
	item.width = width * grid_cell_size;
	item.height = height * grid_cell_size;
	item.name = name;

	Konva.Image.fromURL(url, function(image) {
		image.setAttrs({
			x: col * grid_cell_size,
			y: row * grid_cell_size,
			width: width * grid_cell_size,
			height: height * grid_cell_size,
			draggable: true,
			name: name,
		});//setAttrs

		//*
		//code for drag and drop grid taken from:
		//https://codepen.io/pierrebleroux/pen/ggpvxj
		image.on('dragstart', (e) => {
			image.moveToTop();
		});

		image.on('dragend', (e) => {
			let col = Math.round(image.x() / grid_cell_size);
			let row = Math.round(image.y() / grid_cell_size);
			image.position({
				x: col * grid_cell_size,
				y: row * grid_cell_size
			});

			//If the user has moved it to another spot
			//Update the last space and current space
			//Otherwise the user has clicked the item and dropped it again, do nothing
			if (item.currentSpaceID !== (col + "" + row)) {
				item.lastSpaceID = item.currentSpaceID;
				item.currentSpaceID = col + "" + row;
			}

			stage.batchDraw();
		});
		layer.add(image);
		layer.batchDraw();
	});

	return item;
}

/**
 * Creates and links all elements of inventory. Also manages collision handling
 * between items. If a user tries to drop an item on another or a blocked space
 * it will be moved back to it's original place.
 *
 * @param {String} direction - Display inventory vertically or horizontally
 *
 */
function display_inventory(direction) {

	let stage_wrapper = create_stage_wrapper(direction);
	let grid = create_grid_layer(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
	let item_layer = new Konva.Layer();

	stage_wrapper.stage.add(grid);
	stage_wrapper.stage.add(item_layer);

	let character_items = {};

	// Create a new item for each item passed in from the back end.
	// The newItem function registers the image with the konva layer
	// The Konva image object and the object returned from newItem are linked by "item.name"
	// This way we can access the SpaceIDs for each konva image object
	item_data.forEach((item, index) => {
		let current_item = newItem(item.name, 0, index, 1, 1, media_url + item.image, stage_wrapper.grid_cell_size, item_layer, stage_wrapper.stage);
		character_items[item.name] = current_item;
	});

	// If a drag event finishes on the item layer check the user has not dropped an item on top of another or a blocked cell.
	item_layer.on('dragend', (e) => {
		// The item that was moved in the character_items object.
		let moved_item = character_items[e.target.name()];

		// Loop through all other items
		item_layer.children.each(function(child) {

			// If we are not comparing the moved item to itself
			if (child !== e.target) {
				// Check to see if the new moved item's current location is the same as another item
				if (moved_item.currentSpaceID === character_items[child.name()].currentSpaceID) {
					// If so, move it back to its old location
					e.target.to({
						x: moved_item.lastSpaceID[0] * stage_wrapper.grid_cell_size,
						y: moved_item.lastSpaceID[1] * stage_wrapper.grid_cell_size,
						duration: 0.5,
					})
					// Update the current space ID. Important to do!
					moved_item.currentSpaceID = moved_item.lastSpaceID;
				}
			}

		});
	});
}


//TODO save items positions, so that if the grid is redrawn they're still in the correct grid.
//TODO send updated information to the backend.
