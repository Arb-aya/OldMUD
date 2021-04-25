/**** This file provides the functionality to create a Konva stage, and draw a grid on it.
    * It also allows for the creation of an "item_layer" that manages items and their locations.
    * It provides functions for manipulating that.
    */
import { new_item } from './item.js';

//Change this as needed.
const GRID_CELL_SIZE = 75;


/**
 * Creates an object that allows users to manage items in a grid drawn on a Konva stage.
 *
 * Creates an object called "spaces" where each property name corresonds to a grid cell (e.g, 01)
 * If an item is stored there the value of that property would be set to the item name
 * If no item is stored there the value of that property would be false
 *
 * @param {Number} rows      - How many rows there are in the grid.
 * @param {Number} cols      - How many cols there are in the grid.
 * @param {Number} cell_size - Size of one cell on the grid
 * @return {Object}          - Exposes a number of properties and methods for managing the inventory.
 */
function create_item_layer_wrapper(rows, cols, cell_size) {

    let wrapper = {};
    // the konva layer to draw the items to
    let layer;
    // Object that keeps track of where items are stored
    let spaces = {};
    // Keep track of spaces items were in before the grid is redrawn
    let old_spaces = {};
    let items = {};

    /**
     * Generates the spaces object
     *
     * @param {Number} rows - Number of rows
     * @param {Number} cols - Number of columns
     */
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

        wrapper.spaces = spaces;
        wrapper.old_spaces = old_spaces;
    };

    create(rows, cols);

    /*
     * Converts a spaceid to equivalent index for example if 03 was the third cell it would return 3
     * Used to store item locations in the database as inventory sizes and shapes can differ
      * so spaceid's are not suitable for persistant storage
     * @param {String} space_id - space id of cell: row + "" + col
     * @return {Integer} -1 if not found, otherwise the index of the cell.
     */
    wrapper.spaceid_to_index = function(space_id) {
        if (space_id === "-1")
            return space_id;

        const available_spaces = Object.getOwnPropertyNames(spaces).sort();
        return available_spaces.findIndex((space) => space === space_id);
    }

    /**
     * Converts an id to spaceid equivalent
     * Used for reading the position from the database and getting the equivalent grid location
     * @param {Number} index - The index to convert
     * @return {String} Empty string if not found, otherwise the spaceid
     */
    wrapper.index_to_spaceid = function(index) {
        const available_spaces = Object.getOwnPropertyNames(spaces).sort();
        if (index < 0 || index > available_spaces.length) {
            return ""
        }
        return available_spaces[index];
    }

    /**
     * Used to load items into the inventory stage on page load.
     *
     * @param {Object} item_data - Object from backend that contains item info
     * @throws {Error} - If not enough inventory spaces to load items
     */
    wrapper.load_item = function(item_data) {
        let currentSpace, lastSpace;
        //If the item has location information use it
        //Otherwise get the next free inventory space
        if (item_data.currentSpaceIndex !== "-1") {
            //Convert IDs to indices
            currentSpace = wrapper.index_to_spaceid(item_data.currentSpaceIndex);
            lastSpace = wrapper.index_to_spaceid(item_data.lastSpaceIndex);
        } else {
            const next_space = wrapper.next_empty_space();
            currentSpace = next_space;
            lastSpace = next_space;
        }

        //if currentspace is none, we can't place the item
        //Let the calling code deal with it however seen fit
        if (currentSpace === "none") {
            throw `No inventory space for ${item_data.name}`;
        }
        else {
            //Create new item object
            const item = new_item(item_data, currentSpace, lastSpace, wrapper.layer, cell_size);

            //Register the item in the space
            spaces[currentSpace] = item.name;
            items[item.name] = item;

        }
    }


    /**
     * Checks to see if the grid location at spaceID is empty
     *
     * @param {String} spaceID - Grid location for example 01,22,03, etc
     * @return {Boolean} True if free, false if not
     */
    wrapper.is_space_empty = function(spaceID) {
        if (spaceID in wrapper.spaces) {
            return !wrapper.spaces[spaceID];
        }
        return false;
    }

    /**
     * Swaps two items in the inventory
     *
     * @param {String} item_one_name - Name of first item
     * @param {String} item_two_name - Name of second item
     */
    wrapper.swap_items = function(item_one_name, item_two_name) {
        const item_one = wrapper.items[item_one_name];
        const item_two = wrapper.items[item_two_name];
        const temp_spaceid = item_one.currentSpaceID;

        wrapper.spaces[item_two.currentSpaceID] = item_one.name;
        item_one.move_to(item_two.currentSpaceID);

        wrapper.spaces[temp_spaceid] = item_two.name;
        item_two.move_to(temp_spaceid);
    };

    /**
     * Finds which grid item_name is stored in
     *
     * @param {String} item_name - Name of the item to search for
     * @return {String} "none" if not found, or spaceid if found
     */
    wrapper.get_item_location = function(item_name) {
        let space_index = "none";
        Object.entries(wrapper.spaces).forEach(([key, value]) => {
            if (value === item_name.trim()) {
                space_index = key;
                return;
            }
        });
        return space_index;
    };

    /**
     * Get the item stored at location
     *
     * @param {String} spaceID - Location to get item from
     * @return {String} spaceID if found, otherwise undefined
     */
    wrapper.get_item_at_location = function(spaceID){
        return wrapper?.spaces[spaceID];
    }

    /**
     * Move item to location
     *
     * @param {String} spaceID - Location to move item to
     * @param {String} item_name - Name of item to move
     * @return {Boolean} True if item was found and moved, false otherwise
     */
    wrapper.move_item_to = function(spaceID, item_name) {
        let item_object = wrapper.items[item_name];
        //If the spaceID is empty
        if (!wrapper.spaces[spaceID]) {
            //Update internal inventory mapping
            wrapper.remove_item_from(item_object.currentSpaceID);
            wrapper.spaces[spaceID] = item_object.name;
            //Update space information on the item object
            item_object.move_to(spaceID);
            return true;
        }
        return false;
    }

    /**
     * Removes item from inventory
     *
     * @param {String} item_name - Name of item to remove
     */
    wrapper.remove_item = function(item_name) {
        const item_object = wrapper?.items[item_name];

        if (item_object) {
            wrapper.remove_item_from(wrapper.get_item_location(item_object.name));
            delete wrapper.items[item_name];
        }
    }

    /**
     * Adds an item to the inventory by:
     * Giving the item_object valid spaceIDs
     * Setting image_object.equipped to false
     * Adding the object to wrapper.items
     * Adding the konva object to the layer
     * Resizing the image
     * Moving konva object to the correct space
     *
     * @param {Konva.node} konva_item - Item to add
     * @param {Object} item_object - Twined item object to the konva item (see item.js)
     * @param {String} spaceID - Location to add item to
     */
    wrapper.add_item = function(konva_item, item_object, spaceID) {
        if (spaceID === "-1" || !(spaceID in wrapper.spaces)) {
            spaceID = wrapper.next_empty_space();
        }

        if (spaceID !== "none") {
            item_object.lastSpaceID = spaceID;
            item_object.currentSpaceID = spaceID;
            item_object.equipped = false;
            item_object.layer = wrapper.layer;
            item_object.cell_size = GRID_CELL_SIZE;

            wrapper.spaces[spaceID] = item_object.name;
            wrapper.items[item_object.name] = item_object;
            wrapper.layer.add(konva_item);

            konva_item.width(item_object.width * GRID_CELL_SIZE);
            konva_item.height(item_object.height * GRID_CELL_SIZE);

            konva_item.position({
                x: spaceID[1] * GRID_CELL_SIZE,
                y: spaceID[0] * GRID_CELL_SIZE,
            });
        }
    }

    /**
     * If spaceID is in spaces mark it as empty
     *
     * @param {String} spaceID - The string representing the space (col+""+row)
     */
    wrapper.remove_item_from = function(spaceID) {

        if (spaceID in wrapper.spaces) {
            wrapper.spaces[spaceID] = false;
        }
    }

    /** Checks for the next free space in the inventory
     *
     * @return {String} The space ID of the next free space (col+""+row) or "none" if no free spaces
     */
    wrapper.next_empty_space = function() {
        // Turn the property names of the this.spaces object into an array.
        // Filter out any spaces that are "false" as they are not free
        // Sort the array.
        // The next free space will be the first element of this array
        const free_spaces = Object.getOwnPropertyNames(spaces).sort().filter((id) => {
            return !spaces[id];
        });

        if (free_spaces.length > 0) {
            return free_spaces[0];
        }
        else {
            return "none";
        }
    };

    /**
     * Prevent an item from occupying a space
     *
     * @param {String} spaceID  - Which space to block
     * @param {Number} [width]  - How many spaces wide
     * @param {Number} [height] - How many spaces high
     * @return {Object} Returns an object that exposes:
     * 	obj.lastSpaceID    - last space occupied by block
     * 	obj.currentSpaceID - current space occupied by block
     * 	obj.name           - name of the block
     */
    wrapper.block_space = function(spaceID, width = 1, height = 1) {
        wrapper.spaces[spaceID] = "blocked";

        let blocked_space = {};
        blocked_space.lastSpaceID = spaceID;
        blocked_space.currentSpaceID = spaceID;
        blocked_space.name = "blocked";

        //Add the rectangle to the konva layer
        const blocked_rect = new Konva.Rect({
            x: spaceID[1] * cell_size,
            y: spaceID[0] * cell_size,
            width: width * cell_size,
            height: height * cell_size,
            fill: 'red',
            opacity: 0.3,
            name: "blocked",
        });

        wrapper.layer.add(blocked_rect);
        wrapper.layer.batchDraw();

        return blocked_space;
    }

    wrapper.layer = layer;
    wrapper.create = create;
    wrapper.items = items;

    /*
     * If a drag event ends on the inventory stage it could mean a number of things:
     *
     * 1.) The user has moved an item into another empty slot within the inventory.
     * 2.) The user has moved an item on top of another item to swap their locations.
     *
     *  This function handles both, then fires an "update" event with the updated information
     *  for the database attached.
     *
     */
    wrapper.layer.on('dragend', (e) => {
        let moved_item = wrapper.items[e.target.name()];
        //Where did the dragevent end, converted to a spaceID (row+""+col)
        let dragend_location = Math.round(e.target.attrs.y / GRID_CELL_SIZE) + "" + Math.round(e.target.attrs.x / GRID_CELL_SIZE);


        //If the drag ends in the same location that the item is currently in, ignore it
        if (dragend_location === moved_item.currentSpaceID) {
            return;
        }
        //If the dragend_location is empty, move the item into it
        else if (wrapper.is_space_empty(dragend_location)) {
            const data = [
                {
                    'name': moved_item.name,
                    'lastSpaceIndex': wrapper.spaceid_to_index(moved_item.currentSpaceID),
                    'currentSpaceIndex': wrapper.spaceid_to_index(dragend_location),
                },
            ];

            wrapper.move_item_to(dragend_location, e.target.name());
            wrapper.layer.fire('update', { 'data': data }, true);
            return;
        }
        //The location isn't empty
        else {
            Object.entries(wrapper.items).forEach(function([item_name, item_object]) {
                //If we are not comparing an item to itself
                if (item_name !== e.target.name()) {
                    //If the drag finishes on another item in the invenory
                    //swap them
                    if (dragend_location === item_object.currentSpaceID) {
                        wrapper.swap_items(item_object.name, e.target.name());
                        const item_to_swap = wrapper.items[e.target.name()];

                        const data = [
                            {
                                'name': item_object.name,
                                'lastSpaceIndex': wrapper.spaceid_to_index(item_object.lastSpaceID),
                                'currentSpaceIndex': wrapper.spaceid_to_index(item_object.currentSpaceID),
                            },
                            {
                                'name': item_to_swap.name,
                                'lastSpaceIndex': wrapper.spaceid_to_index(item_to_swap.lastSpaceID),
                                'currentSpaceIndex': wrapper.spaceid_to_index(item_to_swap.currentSpaceID),
                            },
                        ];

                        wrapper.layer.fire('update', { 'data': data }, true);
                        return;
                    }
                }//item_name !== e.target.name()
            });//forEach
        }//else

        e.target.fire('unfinished_drag', {}, true);
    });//on('dragend')

    /**
     * If during the drag the item is dragged off the top of the stage
     *  fire a "select" event.
     *
     *  If the item is dragged back into the stage fire a "deselect" event.
     */
    let old_y;
    wrapper.layer.on('dragmove', (e) => {
        let y = Math.round(e.target.absolutePosition().y / GRID_CELL_SIZE);

        if (y < 0 && old_y >= 0) {
            e.target.fire('select', {}, true);
        }

        if (y >= 0 && old_y < 0) {
            e.target.fire('deselect', {}, true);
        }

        old_y = y;
    });

    return wrapper;
};

/**
 * Create a Konva.Stage object for the inventory section of the UI.
 * Draw a grid to show spaces to the user
 *
 * @param {String} [direction] - Which way do we draw the grid. horizontal or vertical
 * @param {Number} character_inventory_size - How many spaces in the inventory
 *
 * @return {Object} Object that exposes the following:
    obj.display_size                               - The size we display the inventory as. Might be different to actual inventory size as we need to have an even number to draw the grid.
    obj.grid_cell_size                             - The size of one cell (both width and height)
    obj.stage                                      - The konva.stage object;
    obj.draw                                       - Resizes and draws the stage and grid
 */
function create_inventory_wrapper(direction = 'horizontal', character_inventory_size) {
    let stage_wrapper = {};


    let rows, cols;
    let width, height;
    let display_size;
    let stage;
    let grid_layer;

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


        // Draw the grid on a layer and add it to the stage
        if (!grid_layer) {
            grid_layer = new Konva.Layer();
        }
        else {
            grid_layer.destroyChildren();
            grid_layer.clear();
        }

        for (let i = 0; i <= cols; i++) {
            grid_layer.add(new Konva.Line({
                points: [Math.round(i * GRID_CELL_SIZE), 0, Math.round(i * GRID_CELL_SIZE), height],
                stroke: '#ddd',
                strokewidth: 1,
            }));
        }

        grid_layer.add(new Konva.Line({ points: [0, 0, 10, 10] }));
        for (let j = 0; j <= rows; j++) {
            grid_layer.add(new Konva.Line({
                points: [0, Math.round(j * GRID_CELL_SIZE), width, Math.round(j * GRID_CELL_SIZE)],
                stroke: '#ddd',
                strokewidth: 1,
            }));
        }

        stage.add(grid_layer);
    }

    draw(direction);

    stage_wrapper.display_size = display_size;
    stage_wrapper.grid_cell_size = GRID_CELL_SIZE;
    stage_wrapper.stage = stage;
    stage_wrapper.draw = draw;

    stage_wrapper.stage.on("mouseup touchend", (e) => {
        const x = Math.floor(e.evt.layerX / GRID_CELL_SIZE);
        const y = Math.floor(e.evt.layerY / GRID_CELL_SIZE);
        stage_wrapper.stage.fire("unequip",{'spaceID':y+''+x},true);
    });

    return stage_wrapper;
}

export { create_item_layer_wrapper, create_inventory_wrapper };
