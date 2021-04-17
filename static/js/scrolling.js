/**
 * Generates incremental steps used in the opacity
 * IntersectionObserver
 *
 * @return {Array} [Array of Numbers]
 */
const generateThresholds = () => {
	let init_array = [];
	for (let i = 0; i < 100; i++) {
		let val = Number(`0.${i}`);
		init_array.push(val);
	}
	init_array.push(1);
	return init_array
};

thresholds = generateThresholds();

/**
* Options for the Intersection Observers
*/
const options_opacity = {
	root: null, // browser viewport
	threshold: thresholds,
};

const options_animation = {
	root: null,
	threshold: 0.7, // 0.0 => 1.0

}

/**
 * Callback functions for the intersection observers
 */


/**
 * Sets the opacity of entry to the intersection ratio.
 */
const callback_opacity = (entries) => {
	entries.forEach(entry => {
		if (entry.target.classList.contains('seen-left') || entry.target.classList.contains('seen-right')){
			entry.target.style.opacity = entry.intersectionRatio;
		}
	});
};

/**
 * Triggers CSS animations on content sections on the home page.
 */
const callback_animation = (entries) => {
	entries.forEach(entry => {
		if (entry.intersectionRatio > 0) {
			if (entry.target.parentNode.classList.contains('section-slope-right')) {
				entry.target.classList.add('seen-left');
			} else {
				entry.target.classList.add('seen-right');
			}
		}
	});
}

const opacity_observer = new IntersectionObserver(callback_opacity, options_opacity);
const animation_observer = new IntersectionObserver(callback_animation, options_animation);

const targets = document.querySelectorAll(".section-content");

targets.forEach(function(target) {
	opacity_observer.observe(target);
	animation_observer.observe(target)
});
