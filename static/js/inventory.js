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

// Need this to allow post data to server via AJAX
let csrf_token;
document.addEventListener('DOMContentLoaded', (e) => {
	// Load in data from backend. Passed via json_script filter.
	item_data = JSON.parse(document.getElementById('itemdata').textContent);
	character_inventory_size = Number(JSON.parse(document.getElementById('inventory_size').textContent));
	media_url = JSON.parse(document.getElementById('media_url').textContent);

	csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;

	initial_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';

	manage_inventory(initial_direction);
});


// If the window resizes we need to check if we want to change to a horizontal / vertical grid
window.addEventListener('resize', (e) => {

	// Only redraw the grid if it changes from horizontal to vertical or vice versa
	let new_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';
	if (new_direction !== initial_direction) {
		initial_direction = new_direction;
		manage_inventory(new_direction);
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
 * @param {String} name                   - Name of the item
 * @param {Number} col                    - Which column do we place the item in?
 * @param {Number} row                    - Which row do we place the item in?
 * @param {Number} width                  - How many "cells" does the item occupy on the X axis
 * @param {Number} height                 - How many "cells" does the item occupy on the Y axis
 * @param {String} url                    - URL to the image for the item
 * @param {Number} grid_cell_size         - The size of one grid cell in pixels
 * @param {Item Layer Wrapper} item_layer - Object returned from @create_item_layer_wrapper
 * @param {Konva Stage Objet} stage       - Konva Stage object
 */
function newItem(name, col, row, width, height, url, grid_cell_size, item_layer, stage) {

	// Object returned from this method
	let item = {};

	// Space IDs are IDs that describe one cell in the grid. For example, 00 is the first cell (top left).
	// We keep track of the last space occupied by an item as well as the current one.
	item.lastSpaceID = col + "" + row;
	item.currentSpaceID = col + "" + row;
	item.width = width * grid_cell_size;
	item.height = height * grid_cell_size;
	item.name = name;
	item_layer.add_item_to(item.currentSpaceID);

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
				item_layer.remove_item_from(item.lastSpaceID);
				item.lastSpaceID = item.currentSpaceID;
				item.currentSpaceID = col + "" + row;
				item_layer.add_item_to(item.currentSpaceID);
			}

			stage.batchDraw();
		});
		item_layer.layer.add(image);
		item_layer.layer.batchDraw();
	});

	return item;
}


/**
 * Creates a wrapper around a Konva layer used for items.
 * The wrapper provides functionality for managing free spaces
 * in the inventory.
 *
 * @param {Number} rows - Number of rows
 * @param {Number} cols - Number of columns
 */
function create_item_layer_wrapper(rows, cols) {
	let layer_wrapper = {};
	let spaces = {};

	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			spaces[i + "" + j] = true;
		}
	}

	layer_wrapper.layer = new Konva.Layer();
	layer_wrapper.spaces = spaces;

	/**
	 * Check if a space is empty
	 *
	 * @param {String} spaceID - (col+""+row) space to check
	 * @return {Boolean} True if it is empty, false if not.
	 */
	layer_wrapper.is_space_empty = function(spaceID) {
		if (spaceID in this.spaces) {
			return this.spaces[spaceID];
		}
		else {
			return false;
		}
	};
	/**
	 * If spaceID is in spaces mark it as occupied
	 *
	 * @param {String} spaceID - The string representing the space (col+""+row)
	 */
	layer_wrapper.add_item_to = function(spaceID) {
		if (spaceID in this.spaces) {
			this.spaces[spaceID] = false;
		}
	};

	/**
	 * If spaceID is in spaces mark it as empty
	 *
	 * @param {String} spaceID - The string representing the space (col+""+row)
	 */
	layer_wrapper.remove_item_from = function(spaceID) {
		if (spaceID in this.spaces) {
			this.spaces[spaceID] = true;
		}
	}
	/**
	 * Checks for the next free space in the inventory
	 *
	 * @return {String} The space ID of the next free space (col+""+row) or "none" if no free spaces
	 */
	layer_wrapper.next_empty_space = function() {
		// Turn the property names of the this.spaces object into an array.
		// Filter out any spaces that are "false" as they are not free
		// Sort the array.
		// The next free space will be the first element of this array
		let free_spaces = Object.getOwnPropertyNames(this.spaces).filter((space) => this.spaces[space]).sort();

		if (free_spaces.length > 0) {
			return free_spaces[0];
		}
		else {
			return "none";
		}
	};
	return layer_wrapper;
}

/**
 * Creates and links all elements of inventory. Also manages collision handling
 * between items. If a user tries to drop an item on another or a blocked space
 * it will be moved back to it's original place.
 *
 * @param {String} direction - Display inventory vertically or horizontally
 *
 */
function manage_inventory(direction) {

	let stage_wrapper = create_stage_wrapper(direction);
	let grid = create_grid_layer(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
	let item_layer_wrapper = create_item_layer_wrapper(stage_wrapper.rows, stage_wrapper.cols);

	stage_wrapper.stage.add(grid);
	stage_wrapper.stage.add(item_layer_wrapper.layer);


	// Used to store item wrapper classes. These are used in collision detection.
	let character_items = {};

	// Sort the items into those that have an assigned space
	// and those that don't. "no" is the default value provided by
	// the Item django model (see MUD/models.py)
	let placed_items = [];
	let unplaced_items = [];
	item_data.forEach((item) => {
		if (item.currentSpaceID === "no") {
			unplaced_items.push(item);
		}
		else {
			placed_items.push(item);
		}
	});

	/*
		* Placing items goes as follows:
		* 1. pass information into newItem method.
		* 	This registers the image on the konva canvas and returns a wrapper object.
		* 	It also updates the free spaces in the item_layer_wrapper
		* 2. Add the item_wrapper object to character_items
	*/

	//Place placed items first, unplaced items can fill in the empty spaces
	placed_items.forEach((item) => {
		let current_item = newItem(item.name, item.currentSpaceID[0], item.currentSpaceID[1], 1, 1, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);
		character_items[item.name] = current_item;
	});

	unplaced_items.forEach((item) => {
		let next_space = item_layer_wrapper.next_empty_space();
		if (next_space !== "none") {
			let current_item = newItem(item.name, next_space[0], next_space[1], 1, 1, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);
			character_items[item.name] = current_item;
		}
		else {
			console.log("No more free spaces");
		}
	});


	// If a drag event finishes on the item layer check the user has not dropped an item on top of another or a blocked cell.
	item_layer_wrapper.layer.on('dragend', (e) => {
		// The item that was moved in the character_items object.
		let moved_item = character_items[e.target.name()];

		// Loop through all other items
		item_layer_wrapper.layer.children.each(function(child) {

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
				else {
					// Save changes to inventory
					// Not sure if doing this after every move is a good idea. But it's the way I'm doing it for now.
					fetch('/character/update_item', {
						credentials: 'same-origin',
						headers: {
							'content-type': 'application/json; charset=utf-8',
							'X-CSRFToken': csrf_token
						},
						method: 'post',
						body: JSON.stringify({
							'item_data': {

								name: moved_item.name,
								lastSpaceID: moved_item.lastSpaceID,
								currentSpaceID: moved_item.currentSpaceID,
							}
						}),
					})
						//TODO handle response and feedback to user in more userfriendly manner
						.then((response) => console.log(response));
				}
			}

		});
	});

}

//TODO read item width and height from django model
