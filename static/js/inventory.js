/**
 * This file is responsible for displaying the inventory to the user
 */


/**
 * Load in dynamic content from django using json_script filter
 */
const items                    = JSON.parse(document.getElementById('itemdata').textContent);
const character_inventory_size = Number(JSON.parse(document.getElementById('inventory_size').textContent));
const media_url                = JSON.parse(document.getElementById('media_url').textContent);

/**
 * Creates a konva canvas with a grid. User items are displayed
 * in the grid, the user can drag and drop the items into
 * different slots
 *
 * @param {String} [type] - [horizontal / vertical menu]
 */
function create_stage(type = 'horizontal') {

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

	const grid_cell_size = 100;
	const width = cols * grid_cell_size;
	const height = rows * grid_cell_size;

	/**
	 * Creates a new image object per item passed in from the backend.
	 *
	 * @param {Number} col     - 	[Which column do we place the item in?]
	 * @param {Number} row     - 	[Which row do we place the item in?]
	 * @param {Number} width   - 	[How many "cells" does the item occupy on the X axis]
	 * @param {Number} height  - 	[How many "cells" does the item occupy on the Y axis]
	 * @param {String} url     -	[URL to the image for the item]
	 * @param {String} layer   - 	[Layer to display item on]
	 * @param {String} stage   - 	[Stage we are using]
	 */
	function newItem(col, row, width, height, url, layer, stage) {
		Konva.Image.fromURL(url, function(image) {
			image.setAttrs({
				x: col * grid_cell_size,
				y: row * grid_cell_size,
				width: width * grid_cell_size,
				height: height * grid_cell_size,
				draggable: true
			});
			/**
			 * Code for drag and drop grid taken from:
			 * https://codepen.io/pierrebleroux/pen/gGpvxJ
			 */
			image.on('dragstart', (e) => {
				image.moveToTop();
			});
			image.on('dragend', (e) => {
				image.position({
					x: Math.round(image.x() / grid_cell_size) * grid_cell_size,
					y: Math.round(image.y() / grid_cell_size) * grid_cell_size
				});
				stage.batchDraw();
			});
			image.on('dragmove', (e) => {
				stage.batchDraw();
			});
			layer.add(image);
			layer.batchDraw();
		});
	}

	var stage = new Konva.Stage({
		container: 'inventory',
		width: width,
		height: height
	});

	var gridLayer = new Konva.Layer();
	var padding = grid_cell_size;

	for (var i = 0; i < width / padding; i++) {
		gridLayer.add(new Konva.Line({
			points: [Math.round(i * padding) + 0.5, 0, Math.round(i * padding) + 0.5, height],
			stroke: '#ddd',
			strokeWidth: 1,
		}));
	}

	gridLayer.add(new Konva.Line({ points: [0, 0, 10, 10] }));
	for (var j = 0; j < height / padding; j++) {
		gridLayer.add(new Konva.Line({
			points: [0, Math.round(j * padding), width, Math.round(j * padding)],
			stroke: '#ddd',
			strokeWidth: 1,
		}));
	}

	var layer = new Konva.Layer();

	items.forEach((item) => {
		newItem(0, 0, 1, 1, media_url + item.image, layer, stage)
	});

	stage.add(gridLayer);
	stage.add(layer);
}

const modal = document.getElementById('inventoryModal');
const modal_body = document.getElementById('modalBody');

/**
 * When the modal is shown this checks if the height is greater than the width.
 * If so display the inventory to the user vertically. Otherwise horizontally.
 *
 */
modal.addEventListener('shown.bs.modal', function(e) {
	if (modal_body.offsetHeight > modal_body.offsetWidth) {
		console.log("yea?");
		create_stage('vertical');
	}
	else {
		create_stage();
	}
});
