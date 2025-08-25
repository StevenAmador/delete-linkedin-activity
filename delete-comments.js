/**
 * Deletes all comments on the LinkedIn Recent Activity page.
 * Step-by-step:
 * 1. Finds all comment dropdown buttons.
 * 2. Clicks the three-dot menu for each comment.
 * 3. Clicks "Delete" in the dropdown.
 * 4. Clicks the confirmation modal's Delete button.
 * 5. Waits for the comment to disappear before continuing.
 */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for the Delete button in the dropdown
async function waitForDeleteButton(timeoutMs = 5000) {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
        const deleteBtn = Array.from(document.querySelectorAll('div.comment-options-dropdown__option-text span.t-bold'))
                               .find(el => el.textContent.trim() === "Delete" && el.offsetParent !== null);
        if (deleteBtn) return deleteBtn;
        await sleep(100);
    }
    return null;
}

// Click the modal's Delete button
async function confirmDeletion(timeoutMs = 5000) {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
        const modal = document.querySelector('.feed-components-shared-decision-modal, .artdeco-modal[role="dialog"]');
        if (modal && modal.offsetParent !== null) {
            const confirmBtn = Array.from(modal.querySelectorAll('button'))
                                     .find(b => b.textContent.trim() === "Delete" || b.classList.contains('artdeco-button--primary'));
            if (confirmBtn) {
                console.log("Clicking confirm Delete on modal...");
                confirmBtn.click();
                return true;
            }
        }
        await sleep(100);
    }
    console.log("Confirmation modal not found.");
    return false;
}

// Wait for the comment to disappear from DOM
async function waitForCommentGone(commentNode, timeoutMs = 5000) {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
        if (!document.contains(commentNode)) return true;
        await sleep(100);
    }
    return false;
}

// Main function to delete all comments
async function deleteAllComments() {
    let keepGoing = true;

    while (keepGoing) {
        const dropdowns = Array.from(document.querySelectorAll('svg.comment-options-dropdown__trigger-icon'))
                               .map(svg => svg.closest('button'));

        if (dropdowns.length === 0) {
            console.log("No more comments found. Done!");
            keepGoing = false;
            break;
        }

        for (const btn of dropdowns) {
            btn.scrollIntoView();
            btn.click();
            await sleep(300); // allow dropdown to render

            const deleteBtn = await waitForDeleteButton();
            if (!deleteBtn) {
                console.log("Delete button not found for a comment, skipping.");
                continue;
            }

            // Save reference to comment container
            const commentNode = btn.closest('li'); // usually each comment is inside a <li> or container
            deleteBtn.click();
            await sleep(200);

            const confirmed = await confirmDeletion();
            if (confirmed && commentNode) {
                await waitForCommentGone(commentNode);
                console.log("Comment deleted successfully.");
            } else {
                console.log("Failed to delete comment.");
            }

            await sleep(500); // small pause before next comment
        }

        // Scroll down a bit to load more comments if needed
        window.scrollBy(0, 500);
        await sleep(1000);
    }
}

deleteAllComments();
