document.addEventListener('DOMContentLoaded', () => {

	const points_el = document.getElementById('id_points');

	/**
	 * Allows users to increase or decrease a certain trait of their character
	 *
	 * @param  e - The event object
	 * @param  String operation - "add" or "subtract"
	 */
	const updatePoints = (e, operation) => {
		e.preventDefault();

		let points_available = Number(points_el.value);

		if (points_available >= 0) {
			const target_trait = document.getElementById(e.currentTarget.dataset.target);
			const default_value = Number(target_trait.defaultValue);

			// Only add points if we have points
			if (points_available > 0 && operation === "add") {

				const new_value = Number(target_trait.value) + 1;
				const max_value = Number(target_trait.dataset.max);

				// If user has added points to this trait without saving, they can claim them back.
				if (new_value > default_value) {
					target_trait.parentElement.parentElement.previousElementSibling.disabled = false;
				}

				if (new_value <= max_value) {
					target_trait.value++;
					points_el.value--;
				}

			}

			if (operation === "subtract") {
				const new_value = Number(target_trait.value) - 1;
				const min_value = Number(target_trait.dataset.min);

				// Users cannot claim back points beyond the original trait value
				if (new_value == default_value) {
					e.currentTarget.disabled = true;
				}

				if (new_value >= min_value) {
					target_trait.value--;
					points_el.value++;
				}
			}
		}
	}

	let inc_buttons = document.querySelectorAll('.incButton');
	let dec_buttons = document.querySelectorAll('.decButton');

	inc_buttons.forEach((btn) => {
		btn.addEventListener('click', (e) => { updatePoints(e, "add") });
	});

	dec_buttons.forEach((btn) => {
		btn.addEventListener('click', (e) => { updatePoints(e, "subtract") });
	});
});
