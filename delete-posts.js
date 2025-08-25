/**
 * Sleep for a specified number of seconds.
 */
function sleep(seconds) {
	return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Timeout helper
 */
function timeout(timeLimit, msg = 'Async call timeout limit reached') {
	return new Promise((_resolve, reject) => {
		setTimeout(() => reject(new Error(msg)), timeLimit * 1000);
	});
}

/**
 * Wait for element to appear
 */
async function awaitThis(selector, parent = document) {
	let element = parent.querySelector(selector);
	if (element) return Promise.resolve(element);
	while (null == element) {
		await sleep(1);
		element = parent.querySelector(selector);
		if (element) return Promise.resolve(element);
	}
	return Promise.reject(null);
}

/**
 * Wait for element removal
 */
async function awaitGone(element) {
	if (null == element) return Promise.resolve("element is gone");
	while (document.contains(element)) {
		await sleep(1);
		if (!document.contains(element)) return Promise.resolve("element is gone");
	}
	return Promise.reject(null);
}

function awaitGoneTimed(element, seconds = 60) {
	return Promise.race([awaitGone(element), timeout(seconds)]);
}

function awaitThisTimed(selector, parent = document, seconds = 60) {
	return Promise.race([awaitThis(selector, parent), timeout(seconds)]);
}

/**
 * Get all edit menu buttons on the page
 */
function getPostEditMenuButtons() {
	return [...document.querySelectorAll(".feed-shared-control-menu__trigger")];
}

/**
 * Scroll to bottom of page to load more activity
 */
async function loadMoreActivity() {
	window.scrollTo(0, document.body.scrollHeight);
}

/**
 * Main loop
 */
async function init() {
	try {
		console.log("** Starting activity deletion ***");

		const editMenuButtons = getPostEditMenuButtons();
		if (editMenuButtons.length === 0) {
			console.log("No posts found!");
			const scrollHeight = document.body.scrollHeight;
			await loadMoreActivity();

			const newEditMenuButtons = getPostEditMenuButtons();
			if (newEditMenuButtons.length === 0 && document.body.scrollHeight === scrollHeight) {
				console.log("No more posts left to delete.");
				return true;
			}

			console.log(">>> Loaded more activity.");
			await sleep(3);
			return init();
		}

		console.log(">>> Deleting loaded activity");
		for (const emButton of editMenuButtons) {
			emButton.scrollIntoView();
			emButton.click();

			const menu = await awaitThisTimed(".feed-shared-control-menu__content");
			if (!(menu instanceof HTMLElement)) {
				throw "Menu not found!";
			} else {
				console.log(`Menu found (id:${menu.id})`);
			}

			const deleteButton = await awaitThisTimed(".option-delete .feed-shared-control-menu__headline", menu);
			if (!(deleteButton instanceof HTMLElement)) {
				throw `Menu (id:${menu.id}) found, but delete button missing!`;
			} else {
				console.log("Delete button found, clicking...");
			}

			deleteButton.click();

			// Wait for modal and grab confirm button
			const modal = await awaitThisTimed(".feed-components-shared-decision-modal");
			if (!(modal instanceof HTMLElement)) {
				throw "Delete confirmation modal not found!";
			}

			const modalAcceptButton = modal.querySelector("button.artdeco-button--primary");
			if (!(modalAcceptButton instanceof HTMLElement)) {
				throw "Post deletion modal confirm button not found!";
			} else {
				console.log("Confirm delete button found, clicking...");
			}

			modalAcceptButton.click();

			// Wait until modal is gone
			const result = await awaitGoneTimed(modal);
			console.log(result);
		}

		console.log(">>> Loading more activity");
		await loadMoreActivity();
		console.log(">>> Done.");
		await sleep(3);
		return init();
	} catch (error) {
		console.error("Error:", error.message || error);
	}

	return true;
}

init();
