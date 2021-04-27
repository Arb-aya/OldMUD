import { create_character_stage } from './character_stage.js';
import { create_item_layer_wrapper, create_inventory_wrapper } from './inventory_stage.js';
/**
 *
 * This file links all of the constituent parts of the inventory frontend.
 * Handles redrawing the grid if the viewport size changes.
 *
 * Loads in the data from the backend and distributes it appropriately.
 */

//Contains character item data loaded in from backend
let item_data;

//Contains character inventory size loaded in from backend
let character_inventory_size;

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
    csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // See is_small_breakpoint for more details
    initial_direction = is_small_breakpoint() ? 'vertical' : 'horizontal';

    inventory_manager = manage_inventory(initial_direction);
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
 * Creates all constituent parts of the inventory and links them together.
 * Returns an object with a redraw function that allows the grid to be redrawn.
 *
 * @param {String} direction - Which direction are we drawing: horizontal or vertical
 * @return {Object} Object that exposes:
 * 		obj.redraw() - Used when we need to redraw the grid horizontally or vertically
 */
function manage_inventory(direction) {
    let wrapper = {}

    //The Konva stage and grid for the inventory
    let inventory_stage = create_inventory_wrapper(direction, character_inventory_size);
    //The items of the inventory
    let inventory = create_item_layer_wrapper(inventory_stage.rows, inventory_stage.cols, inventory_stage.grid_cell_size);
    //The items and the stickman for the character
    let character = create_character_stage();

    //Used to hold a konva node to transfer from inventory to character via drag
    let selected_konva_item;
    //Used to hold a konva node to transfer from character to inventory via drag
    let konva_item_to_unequip;


    /**
     * If the user double clicks an item in the inventory.
     * Equip it, swapping it with any currently equipped item.
     *
     */
    inventory.layer.on('toggle_equip', (e) => {
        const slot = character[e.item_wrapper.slot];
        //Array of objects to send to the database
        const data = [];

        //There is an item currently equipped
        if (slot.children.length === 2) {
            const konva_item = slot.children[0];
            const item_object = character.items[konva_item.name()];
            inventory.add_item(konva_item, item_object, e.item_wrapper.currentSpaceID);
            character.unequip_item(konva_item.name());

            data.push({
                'name': item_object.name,
                'equipped': item_object.equipped,
                'lastSpaceIndex': inventory.spaceid_to_index(item_object.lastSpaceID),
                'currentSpaceIndex': inventory.spaceid_to_index(item_object.currentSpaceID),
            });
        }

        character.equip_item(slot, e.target, e.item_wrapper);
        inventory.remove_item(e.target.name());

        character.layer.batchDraw();
        inventory.layer.batchDraw();

        data.push({
            'name': e.target.name(),
            'equipped': e.item_wrapper.equipped,
            'lastSpaceIndex': inventory.spaceid_to_index(e.item_wrapper.lastSpaceID),
            'currentSpaceIndex': inventory.spaceid_to_index(e.item_wrapper.currentSpaceID),
        });

        write_to_db(data);
    });

    /**
     * User double clicks an item that is equipped.
     * Try to move it into the inventory if there
     * is a free space
     *
     */
    character.layer.on('toggle_equip', (e) => {
        //Get next free inventory space
        const spaceID = inventory.next_empty_space();
        if (spaceID !== "none") {
            inventory.add_item(e.target, e.item_wrapper, spaceID);
            character.unequip_item(e.target.name());
            inventory.layer.batchDraw();
            character.layer.batchDraw();

            const data = [{
                'name': e.item_wrapper.name,
                'equipped': e.item_wrapper.equipped,
                'lastSpaceIndex': inventory.spaceid_to_index(e.item_wrapper.lastSpaceID),
                'currentSpaceIndex': inventory.spaceid_to_index(e.item_wrapper.currentSpaceID),
            }];

            write_to_db(data);

        }
    });

    /*
    * Fired when an item moves locations in the inventory
    */
    inventory.layer.on('update', (e) => {
        write_to_db(e.data);
    });

    /*
    * ****** DRAG TO EQUIP
    * These functions allow the user to "drag" and item from the inventory
    * to an equipment slot on the character canvas.
    */

    /* This is fired when a drag does not finish in either another inventory slot
     * or on top of another item.
     */
    inventory.layer.on('unfinished_drag', (e) => {
        const item_object = inventory.items[e.target.name()];
        item_object.move_to(item_object.currentSpaceID);
        selected_konva_item = null;
    });

    /* This is fired when a dragmove moves off the top of the inventory stage.
     * We keep track of the item being dragged as the user may want to equip it.
     */
    inventory.layer.on('select', (e) => {
        selected_konva_item = e.target;
    });

    /* This is fired when a dragmove moves back onto the inventory stage
     * after being dragged off.
     * We stop keeping track of the item being dragged.
     */
    inventory.layer.on('deselect', (e) => {
        selected_konva_item = null;
    });


    /**
     * Attempts to move an item from the inventory into an equipment slot.
     * If an item is already equipped, the two items swap places.
     *
     * @param {Konva Group} slot - The group to add the item to
     * @param {Konva Node} currently_equipped_item - The image that is currently equipped
     */
    function equip_selected_item(slot, currently_equipped_item) {
        //If we have a selected item from the inventory
        if (selected_konva_item) {
            const item_object = inventory.items[selected_konva_item.name()];
            //If the item's slot type and the slot clicked on match
            if (slot.name() === item_object.slot) {
                //Data to write to the database
                const data = [];

                //If we have an equipped item already, we need to swap with it
                if (currently_equipped_item !== "none") {
                    const equipped_object = character.items[currently_equipped_item.name()];

                    inventory.add_item(currently_equipped_item, equipped_object, item_object.currentSpaceID);
                    character.unequip_item(currently_equipped_item.name());

                    data.push({
                        'name': equipped_object.name,
                        'equipped': equipped_object.equipped,
                        'lastSpaceIndex': inventory.spaceid_to_index(equipped_object.lastSpaceID),
                        'currentSpaceIndex': inventory.spaceid_to_index(equipped_object.currentSpaceID),
                    });
                }

                character.equip_item(slot, selected_konva_item, item_object);
                inventory.remove_item(item_object.name);

                character.layer.batchDraw();
                inventory.layer.batchDraw();

                data.push(
                    {
                        'name': item_object.name,
                        'equipped': item_object.equipped,
                        'lastSpaceIndex': inventory.spaceid_to_index(item_object.lastSpaceID),
                        'currentSpaceIndex': inventory.spaceid_to_index(item_object.currentSpaceID),
                    },
                );

                try {
                    write_to_db(data);
                }
                catch (e) {
                    console.error(e);
                }

            }

        }
        selected_konva_item = null;
    };

    /**
     * On any mouse up event on the character stage, set the selected_item
     * back to null. The item will have already been swapped at this point
     * or the mouse up means the user did not drag it to an equipment slot.
     *
     */
    character.stage.on('mouseup touchend', (e) => {
        selected_konva_item = null;
    });

    /**
     * The various "equip_" events are fired from the Konva groups
     * in character_stage.js. These are fired on mouseup touchend on said groups
     *
     * The e.target will contain the Konva group object
     * e.currently_equipped will contain the Konva node of the item equipped
     * or the string "none" if no item is currently equipped.
     */
    character.layer.on('equip_body', (e) => {
        equip_selected_item(e.target, e.currently_equipped);
    });

    character.layer.on('equip_head', (e) => {
        equip_selected_item(e.target, e.currently_equipped);
    });

    character.layer.on('equip_main_hand', (e) => {
        equip_selected_item(e.target, e.currently_equipped);
    });

    character.layer.on('equip_off_hand', (e) => {
        equip_selected_item(e.target, e.currently_equipped);
    });

    /*
     * ****** END OF DRAG TO EQUIP
     */



    /**
     * If the user starts to drag an item off the bottom of the character stage
     * keep track of it as they may want to unequip it.
     *
     */
    character.layer.on('unequip', (e) => {
        konva_item_to_unequip = e.target;
    });

    /**
     * If the user drags an item back onto the character stage after dragging it off
     * stop tracking the item.
     *
     */
    character.layer.on('cancel_unequip', (e) => {
        konva_item_to_unequip = null;
    });


    /**
     * Called when a mouse up event happens on the inventory stage.
     * This checks to see if a konva node has been stored in 
     * konva_item_to_unequip as a flag that the user wants to unequip
     * an item and store it inventory.
     *
     * @param {String} e.spaceID - The spaceID for the cell that the mouseup was triggered on
     */
    inventory_stage.stage.on('unequip', (e) => {
        //If we are ending an unequip item drag
        if (konva_item_to_unequip) {
            const data = [];

            //It's not an empty space, swap the items
            const item = inventory.get_item_at_location(e.spaceID);
            if (item) {
                const inventory_object = inventory.items[inventory.get_item_at_location(e.spaceID)];
                const inventory_konva_object = inventory_object.layer.findOne(node => { return node.name() === inventory_object.name });
                const slot = character[inventory_object.slot];

                character.equip_item(slot, inventory_konva_object, inventory_object);
                inventory.remove_item(inventory_object.name);

                data.push({
                    'name': inventory_object.name,
                    'equipped': inventory_object.equipped,
                    'lastSpaceIndex': inventory.spaceid_to_index(inventory_object.lastSpaceID),
                    'currentSpaceIndex': inventory.spaceid_to_index(inventory_object.currentSpaceID),
                });
            }

            const item_object = character.items[konva_item_to_unequip.name()];
            inventory.add_item(
                konva_item_to_unequip,
                item_object,
                e.spaceID
            );
            character.unequip_item(konva_item_to_unequip.name());

            data.push({
                'name': item_object.name,
                'equipped': item_object.equipped,
                'lastSpaceIndex': inventory.spaceid_to_index(e.spaceID),
                'currentSpaceIndex': inventory.spaceid_to_index(e.spaceID),
            });
            write_to_db(data);
        }
        konva_item_to_unequip = null;
    });


    /**
     * Writes data to the database. This function makes the following assumptions:
     *    1.) Data is an array of objects
     *    2.) Each object has at least one property of 'name'. This is the name of an    item.
     *
     *   3.) Any further property of the object corresponds directly to a property of an item in the database.
     *
     *
     * @param {Array} data        - Objects to write to the database
     * @throws {"Could not save"} - If the database responds with anything but 200
     * @throws {"Expected Array"} - data is not an array
     */
    function write_to_db(data) {
        if (Array.isArray(data)) {
            fetch('/MUD/update_item', {
                credentials: 'same-origin',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'X-CSRFToken': csrf_token
                },
                method: 'post',
                body: JSON.stringify({
                    'item_data': data,
                }),
            }).then((response) => {
                if (response.status !== 200) {
                    throw "Could not save";
                }
            });
        } else {
            throw `Expected Array got ${typeof data}`
        }
    }

    /**
     * Places items into their appropriate slots on appropriate layer when the page is first loaded.
     */
    function load_items() {
        //Block out any inventory space that was added as an extra
        //Before placing any items
        if (character_inventory_size !== inventory_stage.display_size) {
            const blocked = inventory.block_space((inventory_stage.rows - 1) + "" + (inventory_stage.cols - 1));
            items[blocked.name] = blocked;
        }

        //Sort items into those that are equipped
        //Those that are unequipped and have location data
        //Those that are unequipped and have no location data
        let items_to_equip = [];
        let placed_items = [];
        let unplaced_items = [];

        item_data.forEach((item) => {
            if (item.equipped) {
                items_to_equip.push(item);
            }
            else if (item.currentSpaceIndex !== "-1") {
                placed_items.push(item);
            }
            else {
                unplaced_items.push(item);
            }
        });

        //Place items that have a location first
        placed_items.forEach((item) => {
            try {
                inventory.load_item(item);
            }
            catch (e) {
                console.error(e);
            }
        });

        //Place items that do not have a location next
        unplaced_items.forEach((item) => {
            try {
                inventory.load_item(item);
                const data = [{
                    'name': item.name,
                    'lastSpaceIndex': inventory.spaceid_to_index(inventory.items[item.name].lastSpaceID),
                    'currentSpaceIndex': inventory.spaceid_to_index(inventory.items[item.name].currentSpaceID),
                }];
                write_to_db(data);
            }
            catch (e) {
                console.error(e);
            }
        });

        items_to_equip.forEach((item) => {
            character.load_item(item);
        });
    };

    /**
     * Redraws the inventory grid and places items in their equivalent positions
     *
     * @param {String} direction - vertical or horizontal
     */
    function redraw(direction) {
        inventory_stage.draw(direction);
        inventory.create(inventory_stage.rows, inventory_stage.cols, inventory_stage.grid_cell_size);

        //Update the items on the new grid
        Object.entries(inventory.old_spaces).sort().forEach((space, index) => {
            //If the grid content was not false I.e it had a name
            if (space[1]) {
                let item_name = space[1];

                // Work out the equivalent location on the new grid
                let new_location = inventory.index_to_spaceid(index);

                //Add it to the new grid
                inventory.add_item_to(new_location, space[1]);

                //Update the information in items
                items[item_name].lastSpaceID = new_location;
                items[item_name].currentSpaceID = new_location;

                //Find the corresponding item on the konva layer
                let layer_item = inventory.layer.findOne(node => node.name() === item_name.trim());

                //Redraw it to the new position
                layer_item.absolutePosition({
                    x: new_location[1] * inventory_stage.grid_cell_size,
                    y: new_location[0] * inventory_stage.grid_cell_size,
                });
            }
        });
        //Redraw the changed elements
        inventory_stage.stage.batchDraw();
        inventory.layer.batchDraw();
    }

    load_items();

    inventory_stage.stage.add(inventory.layer);
    wrapper.redraw = redraw

    return wrapper;
}

