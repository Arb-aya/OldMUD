/**** This file provides a "new_item" function, that is resonsible for parsing the item
    * data passed in from the database and doing two things:
    * 1.) Creates a Konva image object and adds it to the "layer" that is passed in.
    *     Assings the konva image the name of item.name
    *
    * 2.) Creates an object that provides the following properties and methods for the item:
    *       * lastSpaceID       - the last cell in inventory occupied by the item
    *       * currentSpaceID    - the current cell in inventory occupied by the item
    *       * width             - How many cells wide the image is
    *       * height            - How many cells tall the image is
    *       * name              - Set the item.name
    *       * slot              - The slot type this item can be equipped in
    *       * item_type         - Type of item (shield, armour, weapon, etc)
    *       * equipped          - Boolean to show if the item is equipped
    *       * layer             - The layer to draw the item to
    *       * equipped_location - If equipped, the Konva container it is stored in
    *       * cell_size         - The size of "one" cell. Used to determine position and height and width.
    *       * move_to(spaceID)  - Function to move the konva image to spaceID
    *       * ondragend         - Moves the item to the nearest column / row if equiped
    *
    * It is important that the konva item and object have the same name as that is how they are "Linked"
    * in this application.
    *
    * Names in Konva are not unique, although I have ensured with my items the names are unique. I might
    * change to IDs at a later date
    */
const media_url = JSON.parse(document.getElementById('media_url').textContent);

export function new_item(item, current_item_position, last_item_position, layer, cell_size, slot = null) {

    let item_wrapper = {};

    let bg_color;'#0072b2';

    switch(item.rarity){
        case 'unusual':
            bg_color = '#2e8b57';
            break;
        case 'rare':
            bg_color = '#8b008b';
            break;

        case 'epic':
            bg_color = '#ffd700';
            break;

        case 'common':
        default:
            bg_color = '#0072b2';
   }
    // Space IDs are IDs that describe one cell in the grid. For example, 00 is the first cell (top left).
    // We keep track of the last space occupied by an item as well as the current one.
    item_wrapper.lastSpaceID = last_item_position;
    item_wrapper.currentSpaceID = current_item_position;

    item_wrapper.width = item.width;
    item_wrapper.height = item.height;

    item_wrapper.name = item.name;
    item_wrapper.slot = item.slot;
    item_wrapper.item_type = item.item_type;
    item_wrapper.equipped = item.equipped;

    item_wrapper.layer = layer;
    item_wrapper.equipped_location = slot;
    item_wrapper.cell_size = cell_size;

    const url = media_url + item.image;
    Konva.Image.fromURL(url, function(image) {
        image.setAttrs({
            x: current_item_position[1] * item_wrapper.cell_size,
            y: current_item_position[0] * item_wrapper.cell_size,
            fill: bg_color,
            width: item_wrapper.width * item_wrapper.cell_size,
            height: item_wrapper.height * item_wrapper.cell_size,
            draggable: true,
            name: item.name,
        });//setAttrs

        //*
        //code for drag and drop snap to grid taken from:
        //https://codepen.io/pierrebleroux/pen/ggpvxj
        image.on('dragstart', (e) => {
            image.moveToTop();
        });

        //Used to trigger a equip or unequip event.
        image.on('dragmove', (e) => {
        });

        image.on('dragend', (e) => {
            if (!item_wrapper.equipped) {
                image.position({
                    x: Math.round(image.x() / item_wrapper.cell_size) * item_wrapper.cell_size,
                    y: Math.round(image.y() / item_wrapper.cell_size) * item_wrapper.cell_size,
                });
            }
            item_wrapper.layer.batchDraw();
        });

        image.on('dblclick dbltap', (e) => {
            image.fire('toggle_equip', { item_wrapper }, true);
        });

        /*
            * I wanted to add more method like this.
            * For example one to move the image into a konva layer.
            * However, when doing so and running the code the browser
            * insisted that the newly created functions were not functions
            * when called in character_stage.js
            *
            * This function only works in inventory_stage.js (for whatever reason)
            * */
        item_wrapper.move_to = function(spaceID) {
            if (spaceID) {
                item_wrapper.lastSpaceID = item_wrapper.currentSpaceID;
                item_wrapper.currentSpaceID = spaceID;
                image.position({
                    x: spaceID[1] * item_wrapper.cell_size,
                    y: spaceID[0] * item_wrapper.cell_size,
                });
                item_wrapper.layer.batchDraw();
            }
        };

        if (item_wrapper.equipped && item_wrapper.slot) {
            item_wrapper.equipped_location.add(image);
            image.moveToBottom();
        }
        else {
            item_wrapper.layer.add(image);
        }

        item_wrapper.layer.batchDraw();

    });

    return item_wrapper;
}



