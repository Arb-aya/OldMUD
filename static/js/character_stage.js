import { new_item } from './item.js';

const media_url = JSON.parse(document.getElementById('media_url').textContent);

/**
 * Creates and provides functions for displaying/managing equipped items.
 *
 * @param {Number} inventory_size                      - How many spaces in the inventory
 * @return {Object} Object that exposes the following:
 * 	obj.stage                                      - The konva stage object
 * 	obj.item_layer                                 - The layer that the items are drawn to
 * 	obj.off_hand                                   - The off hand slot group
 * 	obj.main_hand                                  - The main hand slot group
 * 	obj.body                                       - The body slot group
 * 	obj.head                                       - The head slot group
 *      obj.transfer_item                              - Used to  swap an item from one Konva container to this one.
 *      obj.load_item                                  - Used to create an item in this Konva container
 */
export function create_character_stage() {

    let wrapper = {};

    const width = 300;
    const height = 300;

    const slot_size = 50;

    //We only want to create one stage object
    let stage;
    if (!stage) {
        stage = new Konva.Stage({
            container: 'character',
            width: width,
            height: height
        });
    }

    let items = {};

    //The layer used to display the stickman. This is a static image, doesn't need
    //to be redrawn. So create a separate layer for it
    let character_layer = new Konva.Layer();

    //Create a separate layer for the non-static parts of the stage. The items and slot rectangles
    let item_layer = new Konva.Layer();

    /*
     * For each slot in which an item can be equipped we create:
     *
     * 	A konva group that is positioned on the stage above the appropriate part
     * 	of the stick man. When an item is equipped, it is added to one of these groups
     * 	and positioning it at 0,0 means it will always be in the correct position on
     * 	the stage
     *
     * 	A konva rect that displays to the user this is a place they can equip items. We
     * 	also use the rectange to detect events (mouseup touchend) that are used when equipping items.
     *
     * 	How does it handle an "equip"?
     * 	1.) The rectangle of the group listens for a mouseup touchend event. When detected it causes the
     * 	    Konva group it belongs to, to fire an appropriate "equip_" event.
     *
     * 	    This then means that whatever code catches the event has access to the Konva group
     * 	    and can add an item to it via the event.target property
     *
     */
    function handle_mouse_up(e, group) {
        let item = "none";
        if (group.children.length > 1) {
            item = group.children[0];
        }
        group.fire(`equip_${group.name()}`, { "currently_equipped": item }, true);
    }

    function handle_mouse_down(e, group) {
        if (group.children.length > 1) {
            group.children[0].moveToTop();
            stage.batchDraw();
        }

    }

    var head = new Konva.Group({
        name: 'head',
        x: (width / 2) - (slot_size / 2),
        y: slot_size / 3,
    });

    var head_rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: slot_size,
        height: slot_size,
        fill: 'white',
        opacity: 0.3,
        stroke: 'white',
        strokeWidth: 2,
    });

    head_rect.on('mouseup touchend', (e) => handle_mouse_up(e, head));
    head_rect.on('mousedown touchstart', (e) => handle_mouse_down(e, head));
    head.add(head_rect);

    //See comments above head for how these groups are used
    var main_hand = new Konva.Group({
        name: 'main_hand',
        x: 0,
        y: (height / 2) - slot_size,
    });

    var main_hand_rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: slot_size,
        height: slot_size,
        fill: 'white',
        opacity: 0.3,
        stroke: 'white',
        strokeWidth: 2,
        name: 'main_hand_slot',
    });

    main_hand_rect.on('mouseup touchend', (e) => handle_mouse_up(e, main_hand));
    main_hand_rect.on('mousedown touchstart', (e) => handle_mouse_down(e, main_hand));
    main_hand.add(main_hand_rect);

    //See comments above head for how these groups are used
    var off_hand = new Konva.Group({
        name: 'off_hand',
        x: width - slot_size,
        y: (height / 2) - slot_size,
    });

    var off_hand_rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: slot_size,
        height: slot_size,
        fill: 'white',
        opacity: 0.3,
        stroke: 'white',
        strokeWidth: 2,
        name: 'off_hand_slot',
    });

    off_hand_rect.on('mouseup touchend', (e) => handle_mouse_up(e, off_hand));
    off_hand_rect.on('mousedown touchstart', (e) => handle_mouse_down(e, off_hand));
    off_hand.add(off_hand_rect);


    //See comments above head for how these groups are used
    var body = new Konva.Group({
        name: 'body',
        x: (width / 2) - (slot_size / 2),
        y: (height / 2) - slot_size,
    });

    var body_rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: slot_size,
        height: slot_size,
        fill: 'white',
        opacity: 0.3,
        stroke: 'white',
        strokeWidth: 2,
        name: 'body_slot',
    });

    body.add(body_rect);

    body_rect.on('mouseup touchend', (e) => handle_mouse_up(e, body));
    body_rect.on('mousedown touchstart', (e) => handle_mouse_down(e, body));

    //The stickman to display in the static layer
    Konva.Image.fromURL(media_url + 'stick.png', function(stickman) {
        stickman.setAttrs({
            x: 0,
            y: 0,
            opacity: 1,
        });
        character_layer.add(stickman);
        character_layer.batchDraw();
        stickman.zIndex(0);
    });

    item_layer.add(head);
    item_layer.add(body);
    item_layer.add(main_hand);
    item_layer.add(off_hand);

    character_layer.batchDraw();

    stage.add(character_layer, item_layer);


    wrapper.stage = stage;
    wrapper.layer = item_layer;
    wrapper.off_hand = off_hand;
    wrapper.main_hand = main_hand;
    wrapper.body = body;
    wrapper.head = head;
    wrapper.items = items;

    /**
     * Checks to see if an item is already equipped in slot
     *
     * @param {String} slot - Name of the slot to check
     * @return {Boolean} True if yes, false if no
     */
    wrapper.has_item_equipped = function(slot) {
        return wrapper[slot]?.children.length > 1;
    };


    /**
     * Moves a konva node from one container to this one
     *
     * @param {Konva.group} slot - The Konva group to move the item to.
     * @param {Konva.node} item - The item to add to the group
     */
    wrapper.equip_item = function(container, konva_item, item_object) {
        //If there is an item already equipped ,return it to
        //the calling code so they can do with it what they want
        konva_item.moveTo(container);
        konva_item.moveToBottom();

        //Resize it to the same size as the slot rectangles
        konva_item.width(slot_size);
        konva_item.height(slot_size);

        //Position it in the top left of the group
        konva_item.x(0);
        konva_item.y(0);

        item_object.lastSpaceID = "-1";
        item_object.currentSpaceID = "-1";
        item_object.equipped = true,
            item_object.layer = wrapper.layer;
        item_object.cell_size = slot_size;

        wrapper.items[item_object.name] = item_object;
        wrapper.layer.batchDraw();
    };

    wrapper.unequip_item = function(item_name) {
        delete wrapper.items[item_name];
    }

    /**
     * Used to load items into the container.
     * Differs from transfer in that this used the information
     * passed in from the backend.
     *
     * @param {String} slot     - Name of the group to add it to.
     * @param {Konva.node} item - The item to add
     */
    wrapper.load_item = function(item) {
        const slot = wrapper[item.slot];
        let item_object = new_item(item, '00', '00', item_layer, slot_size, slot);
        wrapper.items[item.name] = item_object;
    };

    /**
    * If a dragend event fires on the character stage, it means
    * that the user has dragged an item around the character
    * we simply want to return the item back to its slot
    *
    */
    wrapper.layer.on('dragend', (e) => {
        e.target.position({
            x: 0,
            y: 0,
        });
        e.target.moveToBottom();
    });

    /**
     * If during the drag the item is dragged off the bottom of the stage
     *  fire a "unequip" event.
     *
     *  If the item is dragged back into the stage fire a "cancel_unequip" event.
     */
    let old_y;
    wrapper.layer.on('dragmove', (e) => {
        let y = e.target.absolutePosition().y;

        if (y > height && old_y <= height) {
            e.target.fire('unequip', {}, true);
        }

        if (y < height && old_y > height) {
            e.target.fire('cancel_unequip', {}, true);
        }
        old_y = y;
    });

    return wrapper;
}
