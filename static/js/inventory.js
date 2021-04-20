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
		initial_direction = new_direction;
		inventory_manager.redraw(new_direction);
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



/**
 * Creates a Konva canvas with a grid. User items are displayed
 * in the grid, the user can drag and drop the items into
 * different slots
 *
 * @param {String} type - horizontal / vertical menu
 */
function create_stage_wrapper(direction = 'horizontal') {

	let stage_wrapper = {};
	const GRID_CELL_SIZE = 100;

	let rows, cols;
	let width, height;
	let display_size;
	let stage;

	// Work out how many slots to display
	function draw(direction) {
		display_size = character_inventory_size;

		if (character_inventory_size % 2 !== 0) {
			display_size = character_inventory_size + 1;
		}


		// Do we display them vertically or horizontally
		cols = display_size / 2;
		rows = 2;

		if (direction === "vertical") {
			cols = 2;
			rows = display_size / 2;
		}

		stage_wrapper.cols = cols;
		stage_wrapper.rows = rows;

		width = cols * GRID_CELL_SIZE;
		height = rows * GRID_CELL_SIZE;

		if (!stage) {
			stage = new Konva.Stage({
				container: 'inventory',
				width: width,
				height: height
			});
		}
		else {
			stage.width(width);
			stage.height(height);
		}
	}

	draw(direction);


	stage_wrapper.display_size = display_size;
	stage_wrapper.grid_cell_size = GRID_CELL_SIZE;
	stage_wrapper.stage = stage;
	stage_wrapper.draw = draw;

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
	let grid_layer_wrapper = {};
	let grid_layer;

	function draw(rows, cols, grid_cell_size, width, height) {

		if (!grid_layer) {
			grid_layer = new Konva.Layer();
		}
		else {
			grid_layer.destroyChildren();
			grid_layer.clear();
		}

		for (let i = 0; i <= cols; i++) {
			grid_layer.add(new Konva.Line({
				points: [Math.round(i * grid_cell_size), 0, Math.round(i * grid_cell_size), height],
				stroke: '#ddd',
				strokewidth: 1,
			}));
		}

		grid_layer.add(new Konva.Line({ points: [0, 0, 10, 10] }));
		for (let j = 0; j <= rows; j++) {
			grid_layer.add(new Konva.Line({
				points: [0, Math.round(j * grid_cell_size), width, Math.round(j * grid_cell_size)],
				stroke: '#ddd',
				strokewidth: 1,
			}));
		}
		grid_layer.batchDraw();
	}

	draw(rows, cols, grid_cell_size, width, height);

	grid_layer_wrapper.draw = draw;
	grid_layer_wrapper.layer = grid_layer;
	return grid_layer_wrapper;
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
	let layer;
	let spaces = {};
	let old_spaces = {};

	function create(rows, cols) {

		old_spaces = Object.assign({}, spaces);

		if (!layer) {
			layer = new Konva.Layer();
		}
		else {
			layer.clear();
		}


		spaces = {}

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				spaces[i + "" + j] = true;
			}
		}

		layer_wrapper.spaces = spaces;
		layer_wrapper.old_spaces = old_spaces;
	};

	create(rows, cols);

	/*
	 * Converts a spaceid to equivalent index
	  @param {String} space_id - space id of cell: row + "" + col
	  @return {Integer} -1 if not found, otherwise the index of the cell.
	 */
	layer_wrapper.spaceid_to_index = function(space_id) {
		const available_spaces = Object.getOwnPropertyNames(spaces).sort();
		return available_spaces.findIndex((space) => space === space_id);
	}

	/**
	 * Converts an id to spaceid equivalent
	 *
	 * @param {Number} index - The index to convert
	 * @return {String} Empty string if not found, otherwise the spaceid
	 */
	layer_wrapper.index_to_spaceid = function(index) {
		const available_spaces = Object.getOwnPropertyNames(spaces).sort();
		if (index < 0 || index > available_spaces.length) {
			return ""
		}
		return available_spaces[index];
	}

	/**
	 * Check if a space is empty
	 *
	 * @param {String} spaceID - (col+""+row) space to check
	 * @return {Boolean} True if it is empty, false if not.
	 */
	layer_wrapper.is_space_empty = function(spaceID) {
		if (spaceID in spaces) {
			if (spaces[spaceID] === true) {
				return true;
			}
		}
		return false;
	}

	/**
	 * If spaceID is in spaces mark it as occupied
	 *
	 * @param {String} spaceID - The string representing the space (col+""+row)
	 */
	layer_wrapper.add_item_to = function(spaceID, item_name) {
		if (spaceID in spaces) {
			spaces[spaceID] = item_name;
			return true;
		}
		return false;
	}

	/**
	 * If spaceID is in spaces mark it as empty
	 *
	 * @param {String} spaceID - The string representing the space (col+""+row)
	 */
	layer_wrapper.remove_item_from = function(spaceID) {
		if (spaceID in spaces) {
			spaces[spaceID] = true;
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
		let free_spaces = Object.getOwnPropertyNames(spaces).filter((space) => spaces[space]).sort();

		if (free_spaces.length > 0) {
			return free_spaces[0];
		}
		else {
			return "none";
		}
	};

	layer_wrapper.layer = layer;
	layer_wrapper.create = create;

	return layer_wrapper;
};

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

		item_layer.add_item_to(item.currentSpaceID, name);
		item_layer.layer.add(image);
		item_layer.layer.batchDraw();
	});

	return item;
}
function block_inventory_space(name, row, col, width, height, cell_size, layer_wrapper) {
	const wrapper = {}
	wrapper.lastSpaceID = row + "" + col;
	wrapper.currentSpaceID = row + "" + col;
	wrapper.name = name;

	layer_wrapper.add_item_to(wrapper.currentSpaceID, name);

	const blocked_space = new Konva.Rect({
		x: col * cell_size,
		y: row * cell_size,
		width: width * cell_size,
		height: height * cell_size,
		fill: 'red',
		opacity: 0.3,
		name: name,
	});

	layer_wrapper.layer.add(blocked_space);
	layer_wrapper.layer.batchDraw();
	return wrapper;
}

/**
 * Creates and links all elements of inventory. Also manages collision handling
 * between items. If a user tries to drop an item on another or a blocked space
 * it will be moved back to it's original place.
 *
 * @param {String} direction - Display inventory vertically or horizontally
 * @param {Object} previous_item_locations - Previous item_layer_wrapper.spaces
 * @return {Object} - Object that gives access to the item_layer_wrapper.spaces
 */
function manage_inventory(direction) {
	let inventory = {}

	let stage_wrapper = create_stage_wrapper(direction);
	let grid = create_grid_layer(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
	let item_layer_wrapper = create_item_layer_wrapper(stage_wrapper.rows, stage_wrapper.cols);

	// Used to store item wrapper classes. These are used in collision detection.
	let character_items = {};


	function redraw(direction) {
		stage_wrapper.draw(direction);
		grid.draw(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
		item_layer_wrapper.create(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size);

		Object.entries(item_layer_wrapper.old_spaces).sort().forEach((space, index) => {
			console.log(space);
			if (space[1] !== true) {
				let item_name = space[1];
				let new_location = item_layer_wrapper.index_to_spaceid(index);

				item_layer_wrapper.add_item_to(new_location,space[1]);

				character_items[item_name].lastSpaceID = new_location;
				character_items[item_name].currentSpaceID = new_location;

				let layer_item = item_layer_wrapper.layer.findOne(node => node.name() === item_name.trim());

				layer_item.absolutePosition({
					x: new_location[1] * stage_wrapper.grid_cell_size,
					y: new_location[0] * stage_wrapper.grid_cell_size,
				});



			}
		});
		item_layer_wrapper.layer.batchDraw();
	}


	//Block out any inventory space that was added as an extra
	//Before placing any items
	//if (character_inventory_size !== stage_wrapper.display_size) {
	//const blocked = block_inventory_space("blocked", stage_wrapper.rows - 1, stage_wrapper.cols - 1, 1, 1, stage_wrapper.grid_cell_size, item_layer_wrapper);
	//character_items[blocked.name] = blocked;
	//}

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
		const item_position = item_layer_wrapper.index_to_spaceid(item.currentSpaceIndex);
		let current_item = new_item(item.name, item_position[0], item_position[1], item.width, item.height, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);

		character_items[item.name] = current_item;
	});

	unplaced_items.forEach((item) => {
		let next_space = item_layer_wrapper.next_empty_space();
		if (next_space !== "none") {
			let current_item = new_item(item.name, next_space[0], next_space[1], item.width, item.height, media_url + item.image, stage_wrapper.grid_cell_size, item_layer_wrapper, stage_wrapper.stage);
			character_items[item.name] = current_item;
			save_item(item.name, item_layer_wrapper.spaceid_to_index(next_space), item_layer_wrapper.spaceid_to_index(next_space));
		}
		else {
			console.log("No more free spaces");
		}
	});


	/**
	 * POSTs updated location information for item "name" to server
	 *
	 * @param {String} name - Name of the item
	 * @param {String} lastSpaceIndex - The last space this item occupied
	 * @param {String} currentSpaceIndex - The current space this item occupies
	 */
	function save_item(name, lastSpaceIndex, currentSpaceIndex) {
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
					lastSpaceIndex: lastSpaceIndex,
					currentSpaceIndex: currentSpaceIndex,
				}
			}),
		})
			//TODO handle response and feedback to user in more userfriendly manner
			.then((response) => {
				if (response.status === 404) {
					throw "Could not save";
				}
			});
	}// save_item()



	/*
	* Collision detection
	*/

	// If a drag event finishes on the item layer check the user has not dropped an item on top of another or a blocked cell.
	item_layer_wrapper.layer.on('dragend', (e) => {
		// The item that was moved in the character_items object.
		let moved_item = character_items[e.target.name()];

		// If there is only one item, any drag is safe so save it.
		if (item_layer_wrapper.layer.children.length === 1) {
			if (moved_item.lastSpaceID !== moved_item.currentSpaceID) {
				try {
					save_item(moved_item.name, item_layer_wrapper.spaceid_to_index(moved_item.lastSpaceID), item_layer_wrapper.spaceid_to_index(moved_item.currentSpaceID))
					console.log("saved" + moved_item.currentSpaceID);
				}
				catch (e) {
					console.log("not saved");
				}
			}
		}
		else {
			// Loop through all other items
			let can_save = true;
			item_layer_wrapper.layer.children.each(function(child) {
				// If we are not comparing the moved item to itself
				if (can_save && child !== e.target) {
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
						can_save = false;
					}
				}
			});
			if (can_save && moved_item.lastSpaceID !== moved_item.currentSpaceID) {
				// Save changes to inventory
				// Not sure if doing this after every move is a good idea. But it's the way I'm doing it for now.
				if (save_item(moved_item.name, item_layer_wrapper.spaceid_to_index(moved_item.lastSpaceID), item_layer_wrapper.spaceid_to_index(moved_item.currentSpaceID))) {
					item_layer_wrapper.add_item_to(moved_item.currentSpaceID, moved_item.name);
					item_layer_wrapper.remove_item_from(moved_item.lastSpaceID);
				}
			}
		}
	});

	stage_wrapper.stage.add(grid.layer);
	stage_wrapper.stage.add(item_layer_wrapper.layer);

	inventory.redraw = redraw

	return inventory;
}

//TODO: Implement blocked inventory spaces
//TODO: Make konva layer in item_layer_wrapper a singleton?
//TODO: When items start to occupy more than one space, you will need to rework how you place items. For example if an item has a width of two it needs to adjacent spaces.
//TODO: Provide functionality to filter items to display based on Type and Slot
