/**
 * This file is responsible for displaying the inventory to the user
 * as well as managing user interactions with the inventory.
 *
 * It provides the functionality to prevent the user from using selected
 * cells in the grid.
 */

//Contains character item data loaded in from backend
let item_data;

//Contains character inventory size loaded in from backend
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

	// See is_small_breakpoint for more details
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
 * Checks to see if the element 'breakpoint-detect' which has d-md-none
 * as a class is displayed.
 *
 */
function is_small_breakpoint() {
	let element = document.getElementById('breakpoint-detect');
	return window.getComputedStyle(element).display === 'block';
}



/**
 * Creates an object with properties and methods that allow
 * the management of the konva stage object
 *
 * @param {String} [direction] - The way are we displaying the grid. horizontal or vertical
 * @return {Object} Object that allows users to access:
 * 		object.cols                                      - Number of columns in the stage (dictated by GRID_CELL_SIZE)
 * 		object.row                                       - Number of rows in the stage (dictated by GRID_CELL_SIZE)
 * 		object.stage                                     - The konva stage object
 * 		object.display_size                              - The number of cells to display to the user. Might differ from
				 * 				   character inventory size
 */
function create_stage_wrapper(direction = 'horizontal') {

	let stage_wrapper = {};

	//Change this as needed.
	const GRID_CELL_SIZE = 100;

	let rows, cols;
	let width, height;
	let display_size;
	let stage;

	function draw(direction) {

		// Work out how many cells to display to the user
		// Currently makes an even number to display
		// TODO: More complex space management algorithm
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

		// We only create on stage and update it on redraws
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
 * Draws a grid of lines on a konva layer object
 *
 * @param {Number} rows           - Number of rows to have (usually passed in from obj from create_stage_wrapper)
 * @param {Number} cols           - Number of columns to have (usually passed in from obj from create_stage_wrapper)
 * @param {Number} grid_cell_size - Size of one grid square (usually passed in from obj from create_stage_wrapper)
 * @param {Number} width          - Maximum width of the stage to draw on (makes sure lines are drawn across the entire stage)
 * @param {Number} height         - Maximum height of the stage to draw on (makes sure lines are drawn across the entire stage)
 * @return {Object}               - Object exposes the konva layer via obj.layer and the function used to draw the grid which can be recalled if needed via obj.draw()
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
 * @param {Number} rows - Number of rows (Usually passed in from a konva stage object and should be the same as fed to the grid layer)
 * @param {Number} cols - Number of columns (Usually passed in from a konva stage object and should be the same as fed to the grid layer)
 * @returns {Object} - Exposes the following:
 * 			obj.layer                           - Konva layer object
 * 			obj.create                          - Used to update the layer on a redraw
 * 			obj.spaces                          - Internal representation of where items are stored in the grid
 * 			obj.old_spaces                      - Internal representation of where items were stored in the grid before a redraw.
 * 			obj.index_to_spaceid(index)         - Returns the "spaceid" of the cell at "index". For example 0                     - > "00"
 * 			obj.spaceid_to_index(spaceid)       - Returns the index of the cell "spaceid". For example "00"                       - > 0
 * 			obj.next_free_space()               - Returns the 'spaceid' of the next free  cell in the grid.
 * 			obj.add_item_to(spaceid, item name) - Registers the item of "item name" at "spaceid"
 * 			obj.remove_item_from(spaceid)       - Sets the value of the grid to false. Effectively "removing" any items.
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
				spaces[i + "" + j] = false;
			}
		}

		layer_wrapper.spaces = spaces;
		layer_wrapper.old_spaces = old_spaces;
	};

	create(rows, cols);

	/*
	 * Converts a spaceid to equivalent index
	 * @param {String} space_id - space id of cell: row + "" + col
	 * @return {Integer} -1 if not found, otherwise the index of the cell.
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
			spaces[spaceID] = false;
		}
	}
	/** Checks for the next free space in the inventory
	 *
	 * @return {String} The space ID of the next free space (col+""+row) or "none" if no free spaces
	 */
	layer_wrapper.next_empty_space = function() {
		// Turn the property names of the this.spaces object into an array.
		// Filter out any spaces that are "false" as they are not free
		// Sort the array.
		// The next free space will be the first element of this array
		const free_spaces = Object.getOwnPropertyNames(spaces).sort().filter((id) => !spaces[id]);

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
 * Creates a new image object and registers it with item_layer via the add_item_to method.
 *
 * It also draws the item on the konva layer and links the konva representation and internal representation of the item via "item.name"
 * Handles the drag and drop logic, as well as "snapping" items to the grid.
 * Code for snapping items to the grid taken from: https://codepen.io/pierrebleroux/pen/gGpvxJ
 *
 * @param {String} name                   - Name of the item
 * @param {Number} col                    - Column of the grid to store the item
 * @param {Number} row                    - Row of the grid to store the item
 * @param {Number} width                  - How many "cells" the item occupies on the X axis
 * @param {Number} height                 - How many "cells" the item occupies on the Y axis
 * @param {String} url                    - URL to the image for the item
 * @param {Number} grid_cell_size         - The size of one grid cell in pixels
 * @param {Item Layer Wrapper} item_layer - The Konva layer to draw the item on (usually the layer returned from create_item_layer_wrapper)
 * @param {Stage Wrapper} stage           - Stage wrapper object that the item_layer will be added to (usually the stage from create_stage_wrapper)
 * @returns {Object} - Object exposes the following for each item:
 * 			obj.name         - name of the item
 * 			obj.lastSpaceID  - the last cell in the grid that the item occupied
 * 			obj.currentSpace - the current cell in the grid that the item occupies
 * 			obj.width        - The width of the item (in grid cells)
 * 			obj.height       - The height of the item (in grid cells)
 */
function new_item(name, row, col, width, height, url, item_layer, stage_wrapper) {

	// Object returned from this method
	let item = {};

	// Space IDs are IDs that describe one cell in the grid. For example, 00 is the first cell (top left).
	// We keep track of the last space occupied by an item as well as the current one.
	item.lastSpaceID = row + "" + col;
	item.currentSpaceID = row + "" + col;
	item.width = width * stage_wrapper.grid_cell_size;
	item.height = height * stage_wrapper.grid_cell_size;
	item.name = name;


	Konva.Image.fromURL(url, function(image) {
		image.setAttrs({
			x: col * stage_wrapper.grid_cell_size,
			y: row * stage_wrapper.grid_cell_size,
			width: width * stage_wrapper.grid_cell_size,
			height: height * stage_wrapper.grid_cell_size,
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
			let col = Math.round(image.x() / stage_wrapper.grid_cell_size);
			let row = Math.round(image.y() / stage_wrapper.grid_cell_size);

			if (col < 0 || row < 0 || col >= stage_wrapper.cols || row >= stage_wrapper.rows) {
				image.position({
					x: item.lastSpaceID[1] * stage_wrapper.grid_cell_size,
					y: item.lastSpaceID[0] * stage_wrapper.grid_cell_size,
				})
			}
			else {
				image.position({
					x: col * stage_wrapper.grid_cell_size,
					y: row * stage_wrapper.grid_cell_size
				});
			}

			stage_wrapper.stage.batchDraw();
		});

		item_layer.layer.add(image);
		item_layer.layer.batchDraw();
	});

	item_layer.add_item_to(item.currentSpaceID, name);

	return item;
}



/**
 * Creates an area in the grid that the user is prevented from using to store items
 *
 * @param {String} name          - Name of the blocked area. Defaults to "blocked". Probably best not to change this.
 * @param {Number} row           - The row to block
 * @param {Number} col           - The column to block
 * @param {Number} width         - How many cells wide should it block
 * @param {Number} height        - How many cells high should it block
 * @param {Number} cell_size     - The size of one grid cell
 * @param {Object} layer_wrapper - The object returned by item_layer_wrapper
 * @returns {Object}                     - Object exposes the following for each item:
 * 			obj.name         - name of the item
 * 			obj.lastSpaceID  - the last cell in the grid that the item occupied
 * 			obj.currentSpace - the current cell in the grid that the item occupies
 */
function block_inventory_space(name = "blocked", row, col, width, height, cell_size, layer_wrapper) {
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
 * Creates all constituent parts of the inventory and links them together.
 *
 * @param {String} direction - Which direction are we drawing: horizontal or vertical
 * @return {Object} Object that exposes:
 * 		obj.redraw() - Used when we need to redraw the grid horizontally or vertically
 */
function manage_inventory(direction) {
	let inventory = {}

	let stage_wrapper = create_stage_wrapper(direction);
	let grid = create_grid_layer(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
	let item_layer_wrapper = create_item_layer_wrapper(stage_wrapper.rows, stage_wrapper.cols);

	// Used to store item wrapper classes. These are used in collision detection.
	let character_items = {};


	/**
	 * Called when we want to redraw the grid
	 *
	 * @param {String} direction - vertical or horizontal
	 */
	function redraw(direction) {
		stage_wrapper.draw(direction);
		grid.draw(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size, stage_wrapper.stage.width(), stage_wrapper.stage.height());
		item_layer_wrapper.create(stage_wrapper.rows, stage_wrapper.cols, stage_wrapper.grid_cell_size);

		//Update the items on the new grid
		Object.entries(item_layer_wrapper.old_spaces).sort().forEach((space, index) => {
			//If the grid content was not false I.e it had a name
			if (space[1]) {
				let item_name = space[1];

				// Work out the equivalent location on the new grid
				let new_location = item_layer_wrapper.index_to_spaceid(index);

				//Add it to the new grid
				item_layer_wrapper.add_item_to(new_location, space[1]);

				//Update the information in character_items
				character_items[item_name].lastSpaceID = new_location;
				character_items[item_name].currentSpaceID = new_location;

				//Find the corresponding item on the konva layer
				let layer_item = item_layer_wrapper.layer.findOne(node => node.name() === item_name.trim());

				//Redraw it to the new position
				layer_item.absolutePosition({
					x: new_location[1] * stage_wrapper.grid_cell_size,
					y: new_location[0] * stage_wrapper.grid_cell_size,
				});
			}
		});
		//Redraw the changed elements
		item_layer_wrapper.layer.batchDraw();
	}


	//Block out any inventory space that was added as an extra
	//Before placing any items
	if (character_inventory_size !== stage_wrapper.display_size) {
		const blocked = block_inventory_space("blocked", stage_wrapper.rows - 1, stage_wrapper.cols - 1, 1, 1, stage_wrapper.grid_cell_size, item_layer_wrapper);
		character_items[blocked.name] = blocked;
	}

	// Sort the items into those that have an assigned space
	// and those that don't. "-1" is the default value provided by
	// the Item django model (see MUD/models.py)
	let placed_items = [];
	let unplaced_items = [];
	item_data.forEach((item) => {
		if (item.currentSpaceIndex === "-1") {
			unplaced_items.push(item);
		}
		else {
			placed_items.push(item);
		}
	});

	//Place items that have a location first
	placed_items.forEach((item) => {
		const item_position = item_layer_wrapper.index_to_spaceid(item.currentSpaceIndex);

		let current_item = new_item(item.name, item_position[0], item_position[1], item.width, item.height, media_url + item.image, item_layer_wrapper, stage_wrapper);

		character_items[item.name] = current_item;
	});

	//Unplaced items (those that don't have a location in the db) can fill in the empty spaces
	unplaced_items.forEach((item) => {
		let next_space = item_layer_wrapper.next_empty_space();
		if (next_space !== "none") {
			let current_item = new_item(item.name, next_space[0], next_space[1], item.width, item.height, media_url + item.image, item_layer_wrapper, stage_wrapper);
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



	/**
	 * Handle the dragend on the konva layer level. This is responsible for making sure that items are not stacked on one another or placed
	 * in a blocked inventory space
	 *
	 */
	item_layer_wrapper.layer.on('dragend', (e) => {

		// The item that was moved in the character_items object.
		let moved_item = character_items[e.target.name()];

		// Workout where the new location will be in the grid
		let new_possible_location = Math.round(e.target.attrs.y / stage_wrapper.grid_cell_size) + "" + Math.round(e.target.attrs.x / stage_wrapper.grid_cell_size);

		// If there is only one item, any drag is safe if the last and current locations are not the same, so save it.
		if (item_layer_wrapper.layer.children.length === 1) {
			if (moved_item.lastSpaceID !== new_possible_location) {
				try {
					save_item(moved_item.name, item_layer_wrapper.spaceid_to_index(moved_item.lastSpaceID), item_layer_wrapper.spaceid_to_index(new_possible_location));

					//Update in layer manager
					item_layer_wrapper.remove_item_from(moved_item.lastSpaceID);
					item_layer_wrapper.add_item_to(new_possible_location, moved_item.name);

					//Update item
					moved_item.lastSpaceID = moved_item.currentSpaceID;
					moved_item.currentSpaceID = new_possible_location;

					console.log("saved" + moved_item.currentSpaceID);
				}
				catch (e) {
					console.log("not saved");
				}
			}
		}
		else { // We have more than one child on the layer

			// Used to break out of a loop in the event of a collosion
			let can_save = true;


			item_layer_wrapper.layer.children.each(function(child) {
				// If we are not comparing an item to itself
				if (can_save && child.name() !== e.target.name()) {
					//If the user tries to move an item onto another item or a blocked space
					if (new_possible_location === character_items[child.name()].currentSpaceID) {
						// Move it back to its previous location
						e.target.to({
							x: moved_item.lastSpaceID[1] * stage_wrapper.grid_cell_size,
							y: moved_item.lastSpaceID[0] * stage_wrapper.grid_cell_size,
							duration: 0.5,
						});

						// Break out of the loop and prevent saving the update
						can_save = false;
					}
				}
			});

			// If we can save the new move and the item has moved from its last position in the grid
			if (can_save && moved_item.lastSpaceID !== new_possible_location) {
				try {
					//Save the changes
					save_item(moved_item.name, item_layer_wrapper.spaceid_to_index(moved_item.lastSpaceID), item_layer_wrapper.spaceid_to_index(new_possible_location));

					//Update layer manager
					moved_item.currentSpaceID = new_possible_location;
					item_layer_wrapper.remove_item_from(moved_item.lastSpaceID);
					item_layer_wrapper.add_item_to(new_possible_location, moved_item.name);

					//Update item
					moved_item.lastSpaceID = moved_item.currentSpaceID;
					moved_item.currentSpaceID = new_possible_location;

					console.log("saved");
				}
				catch (e) {
					console.log("Not saved");
				}
			}
		}
	});

	stage_wrapper.stage.add(grid.layer);
	stage_wrapper.stage.add(item_layer_wrapper.layer);

	inventory.redraw = redraw

	return inventory;
}
