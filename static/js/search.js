let searchTimeout; // Timer reference for debounce

/**
 * Handles the input event for the search field.
 * Debounces the API call to reduce unnecessary requests.
 */
function handleSearchInput() {
    const query = document.getElementById("search-input").value;

    // Clear the previous timeout to prevent firing multiple requests
    clearTimeout(searchTimeout);

    // Hide results and return if the query length is less than 3 characters
    if (query.length < 3) {
        toggleResultsContainer(false); // Hide the results container
        return;
    }

    // Set a timeout to delay the API call by 1 second
    searchTimeout = setTimeout(() => fetchSearchResults(query), 200);
}

/**
 * Fetches search results from the API and updates the results container.
 * @param {string} query - The search query input by the user.
 */
async function fetchSearchResults(query) {
    const resultsContainer = document.getElementById("search-results");
    const endpoints = [
        // "http://localhost:8081/search", // Local development
        "https://searchblog.baophotos.ca/search", // Production
    ];

    for (let endpoint of endpoints) {
        try {
            const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const results = await response.json();

                // Ensure results is an array
                const normalizedResults = Array.isArray(results) ? results : [];

                updateSearchResults(normalizedResults);
                toggleResultsContainer(true); // Show the results container
                return; // Exit the loop on the first successful response
            } else {
                console.warn(`Error: Received ${response.status} from ${endpoint}`);
            }
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
        }
    }

    // If no endpoint succeeded, display an empty result
    updateSearchResults([]);
    toggleResultsContainer(true); // Show the results container
}

/**
 * Clears the search results container.
 */
function clearSearchResults() {
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "";
}

/**
 * Updates the search results container with the fetched results.
 * @param {Array} results - The array of search results.
 */
function updateSearchResults(results) {
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
        resultsContainer.innerHTML = "<p>No results found.</p>";
    } else {
        results.forEach((result) => {
            const resultItem = document.createElement("div");
            resultItem.className = "result-item";
            resultItem.innerHTML = `
                <a href="${result.url}" target="_blank" class="result-link">${result.url}</a>
                <p class="result-excerpt">${result.excerpt}</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    }
}

/**
 * Displays an error message in the search results container.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = `<p>${message}</p>`;
    toggleResultsContainer(true); // Show the results container
}

/**
 * Toggles the visibility of the search results container.
 * @param {boolean} show - Whether to show or hide the container.
 */
function toggleResultsContainer(show) {
    const resultsContainer = document.getElementById("search-results");

    // Add debugging logs
    console.log(`Toggling search results: ${show ? "show" : "hide"}`);

    if (resultsContainer) {
        resultsContainer.style.display = show ? "block" : "none";
    } else {
        console.error("Search results container not found!");
    }
}

/**
 * Closes the search results when the Escape key is pressed.
 */
function closeOnEscape(event) {
    if (event.key === "Escape") {
        toggleResultsContainer(false); // Hide the search results container
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.value = ""; // Clear the search input (optional)
        }
    }
}

// Attach the event listener to the document
document.addEventListener("keydown", closeOnEscape);