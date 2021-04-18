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

// Used to convert item positions when changing from vertical to horizontal and vice versa
let inventory_manager;

document.addEventListener('DOMContentLoaded', (e) => {
	// Load in data from backend. Passed via json_script filter.
	item_data = JSON.parse(document.getElementById('itemdata').textContent);
	character_inventory_size = Number(JSON.parse(document.getElementById('inventory_size').textContent));
	media_url = JSON.parse(document.getElementById('media_url').textContent);

	csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;

	initial_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';

	inventory_manager = manage_inventory(initial_direction);
});


// If the window resizes we need to check if we want to change to a horizontal / vertical grid
window.addEventListener('resize', (e) => {
	// Only redraw the grid if it changes from horizontal to vertical or vice versa
	let new_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';
	if (new_direction !== initial_direction) {
		let old_spaces = inventory_manager.spaces;
		initial_direction = new_direction;
		inventory_manager = manage_inventory(new_direction, old_spaces);
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
function new_item(name, row, col, width, height, url, grid_cell_size, item_layer, stage) {

	// Object returned from this method
	let item = {};

	// Space IDs are IDs that describe one cell in the grid. For example, 00 is the first cell (top left).
	// We keep track of the last space occupied by an item as well as the current one.
	item.lastSpaceID = row + "" + col;
	item.currentSpaceID = row + "" + col;
	item.width = width * grid_cell_size;
	item.height = height * grid_cell_size;
	item.name = name;

	item_layer.add_item_to(item.currentSpaceID, name);

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
			if (item.currentSpaceID !== (row + "" + col)) {
				item_layer.remove_item_from(item.lastSpaceID);
				item.lastSpaceID = item.currentSpaceID;
				item.currentSpaceID = row + "" + col;
				item_layer.add_item_to(item.currentSpaceID, name);
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
 * Design pattern taken from: https://www.dofactory.com/javascript/design-patterns/singleton
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
	layer_wrapper.layer.destroyChildren();
	layer_wrapper.spaces = spaces;

	/**
	 * Check if a space is empty
	 *
	 * @param {String} spaceID - (col+""+row) space to check
	 * @return {Boolean} True if it is empty, false if not.
	 */
	layer_wrapper.is_space_empty = function(spaceID) {
		if (spaceID in this.spaces) {
			if (this.spaces[spaceID] === true) {
				return true;
			}
		}
		return false;
	};
	/**
	 * If spaceID is in spaces mark it as occupied
	 *
	 * @param {String} spaceID - The string representing the space (col+""+row)
	 */
	layer_wrapper.add_item_to = function(spaceID, item_name) {
		if (spaceID in this.spaces) {
			this.spaces[spaceID] = item_name;
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
};


/**
 * Creates and links all elements of inventory. Also manages collision handling
 * between items. If a user tries to drop an item on another or a blocked space
 * it will be moved back to it's original place.
 *
 * @param {String} direction - Display inventory vertically or horizontally
 * @param {Object} previous_item_locations - Previous item_layer_wrapper.spaces
 * @return {Object} - Object that gives access to the item_layer_wrapper.spaces
 */
function manage_inventory(direction, previous_item_locations = null) {
	let inventory = {}

	let stage_wrapper = create_stage_wrapper(direction);
	let grid = create_grid_layer(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
	let item_layer_wrapper = create_item_layer_wrapper(stage_wrapper.rows, stage_wrapper.cols);

	inventory.spaces = item_layer_wrapper.spaces;

	stage_wrapper.stage.add(grid);
	stage_wrapper.stage.add(item_layer_wrapper.layer);


	// Used to store item wrapper classes. These are used in collision detection.
	let character_items = {};

	// If we have previous item locations, map them to the new grid.
	// Otherwise just place the items
	(previous_item_locations) ? place_old_items() : place_items();

	/**
	 * This function is called if the grid is redrawn to a window resize.
	 * It maps old item locations to the equivalent on the new grid
	 *
	 */
	function place_old_items() {
		// Get an array of available spaceIDs in order
		let available_spaces = Object.entries(item_layer_wrapper.spaces).sort();

		// Loop over the old spaceIDs (after they have also been sorted
		Object.entries(previous_item_locations).sort().forEach((item_location, index) => {
			// If we have found an item (i.e the current "item_location"
			let old_item_name = item_location[1];
			if (old_item_name !== true) {
				// The new location is the location stored in available_spaces at the same index
				let new_location = available_spaces[index][0];
				// Get the item data for the found item
				let item_datum = item_data.find(item => item.name.trim() === old_item_name);
				//Add the new item to the layer in the new location
				let current_item = new_item(item_location[1], new_location[0], new_location[1], item_datum.width, item_datum.height, media_url + item_datum.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);
				//Don't forget to add it to character_items for use in collision detection
				character_items[item_location[1]] = current_item;

			}
		});
	}

	/**
	 * Places items in inventory for first time
	 *
	 */
	function place_items() {
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
			* 1. pass information into new_item method.
			* 	This registers the image on the konva canvas and returns a wrapper object.
			* 	It also updates the free spaces in the item_layer_wrapper
			* 2. Add the item_wrapper object to character_items
		*/

		//Place placed items first, unplaced items can fill in the empty spaces
		placed_items.forEach((item) => {
			let current_item = new_item(item.name, item.currentSpaceID[0], item.currentSpaceID[1], item.width, item.height, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);

			character_items[item.name] = current_item;
		});

		unplaced_items.forEach((item) => {
			let next_space = item_layer_wrapper.next_empty_space();
			if (next_space !== "none") {
				let current_item = new_item(item.name, next_space[0], next_space[1], item.width, item.height, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);
				character_items[item.name] = current_item;
				save_item(item.name, next_space, next_space);
			}
			else {
				console.log("No more free spaces");
			}
		});
	}// place_items()

	/**
	 * POSTs updated location information for item "name" to server
	 *
	 * @param {String} name - Name of the item
	 * @param {String} lastSpaceID - The last space this item occupied
	 * @param {String} currentSpaceID - The current space this item occupies
	 */
	function save_item(name, lastSpaceID, currentSpaceID) {
		fetch('/character/update_item', {
			credentials: 'same-origin',
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'X-CSRFToken': csrf_token
			},
			method: 'post',
			body: JSON.stringify({
				'item_data': {

					name: name,
					lastSpaceID: lastSpaceID,
					currentSpaceID: currentSpaceID,
				}
			}),
		})
			//TODO handle response and feedback to user in more userfriendly manner
			.then((response) => {
				if (response.status === 404) {
					console.log("Couldn't save position update");
				}
				else {
					console.log("saved" + currentSpaceID);
				}
			});
	}// save_item()

	// If a drag event finishes on the item layer check the user has not dropped an item on top of another or a blocked cell.
	item_layer_wrapper.layer.on('dragend', (e) => {
		// The item that was moved in the character_items object.
		let moved_item = character_items[e.target.name()];

		// If there is only one item, any drag is safe so save it.
		if (item_layer_wrapper.layer.children.length === 1) {
			if (moved_item.lastSpaceID !== moved_item.currentSpaceID) {
				save_item(moved_item.name, moved_item.lastSpaceID, moved_item.currentSpaceID);
			}
		}
		else {

			// Loop through all other items
			item_layer_wrapper.layer.children.each(function(child) {

				// If we are not comparing the moved item to itself
				if (child !== e.target) {
					// Check to see if the new moved item's current location is the same as another item
					if (moved_item.currentSpaceID === character_items[child.name()].currentSpaceID) {
						// If so, move it back to its old location
						e.target.to({
							x: moved_item.lastSpaceID[1] * stage_wrapper.grid_cell_size,
							y: moved_item.lastSpaceID[0] * stage_wrapper.grid_cell_size,
							duration: 0.5,
						})
						// Update the current space ID. Important to do!
						moved_item.currentSpaceID = moved_item.lastSpaceID;
					}
					else {
						// Save changes to inventory
						// Not sure if doing this after every move is a good idea. But it's the way I'm doing it for now.
						save_item(moved_item.name, moved_item.lastSpaceID, moved_item.currentSpaceID);
					}
				}

			});
		}
	});

	return inventory;
}

//TODO: When items start to occupy more than one space, you will need to rework how you place items. For example if an item has a width of two it needs to adjacent spaces.
//TODO: Provide functionality to filter items to display based on Type and Slot
