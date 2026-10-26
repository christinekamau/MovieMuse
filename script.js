// MovieMuse: Movie Discovery Website

const API_KEY = "0e0e8cfa14085c9c992455baa9e7db57";
const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const movieGrid = document.getElementById("movieGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const emptyMessage = document.getElementById("emptyMessage");
const loadMoreButton = document.getElementById("loadMoreButton");
const genreButtons = document.querySelectorAll(".genre-button");

// Remember what is currently showing so "Load more" knows what to fetch
let currentEndpoint = "/trending/movie/week";
let currentPage = 1;
let totalPages = 1;


// Load movies from TMDB (append = true adds to the grid instead of replacing it)
async function loadMovies(endpoint = "/trending/movie/week", page = 1) {
    const append = page > 1;

    try {
        if (!append) {
            movieGrid.innerHTML = "<p>Loading movies...</p>";
        }

        emptyMessage.hidden = true;
        loadMoreButton.hidden = true;

        const separator = endpoint.includes("?") ? "&" : "?";
        const url = `${API_URL}${endpoint}${separator}api_key=${API_KEY}&page=${page}`;

        const response = await fetch(url);

        if (!response.ok) {
            const details = await response.text();
            console.error("TMDB status:", response.status, details);
            throw new Error(`TMDB returned status ${response.status}`);
        }

        const data = await response.json();

        currentEndpoint = endpoint;
        currentPage = data.page || page;
        totalPages = Math.min(data.total_pages || 1, 500); // TMDB allows up to 500 pages

        displayMovies(data.results || [], append);

        loadMoreButton.hidden = currentPage >= totalPages;

    } catch (error) {
        console.error("Movie loading error:", error);

        if (append) {
            loadMoreButton.hidden = false;
            loadMoreButton.textContent = "Couldn't load more. Try again";
        } else {
            movieGrid.innerHTML = `<p>Unable to load movies: ${error.message}</p>`;
        }
    }
}


// Display movie cards
function displayMovies(movies, append = false) {
    if (!append) {
        movieGrid.innerHTML = "";
    }

    if (movies.length === 0 && !append) {
        emptyMessage.hidden = false;
        return;
    }

    loadMoreButton.textContent = "Load more";

    movies.forEach(movie => {
        const card = document.createElement("article");
        card.className = "movie-card";

        const poster = movie.poster_path
            ? `${IMAGE_URL}${movie.poster_path}`
            : "https://placehold.co/500x750/292929/ffffff?text=No+Poster";

        const title = movie.title || "Untitled Movie";
        const rating = Number(movie.vote_average || 0).toFixed(1);
        const releaseYear = movie.release_date
            ? movie.release_date.slice(0, 4)
            : "Release date unavailable";

        const image = document.createElement("img");
        image.src = poster;
        image.alt = `${title} movie poster`;
        image.loading = "lazy";

        const info = document.createElement("div");
        info.className = "movie-info";
        info.innerHTML = `
            <h3></h3>
            <p class="movie-rating">★ ${rating}/10</p>
            <p class="movie-year">${releaseYear}</p>
            <button class="movie-details-button" type="button">View Details</button>
        `;
        info.querySelector("h3").textContent = title;

        info.querySelector(".movie-details-button").addEventListener("click", () => {
            window.location.href = `movie.html?id=${encodeURIComponent(movie.id)}`;
        });

        card.appendChild(image);
        card.appendChild(info);
        movieGrid.appendChild(card);
    });
}


function clearActiveGenre() {
    genreButtons.forEach(btn => btn.classList.remove("active"));
}


// Search movies
async function searchMovies() {
    const query = searchInput.value.trim();
    clearActiveGenre();

    if (!query) {
        loadMovies();
        return;
    }

    await loadMovies(`/search/movie?query=${encodeURIComponent(query)}`);
}


searchButton.addEventListener("click", searchMovies);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") searchMovies();
});


// Genre buttons
genreButtons.forEach(button => {
    button.addEventListener("click", () => {
        clearActiveGenre();
        button.classList.add("active");
        searchInput.value = "";
        loadMovies(`/discover/movie?with_genres=${button.dataset.genre}`);
        document.getElementById("trending").scrollIntoView();
    });
});


// Load more button
loadMoreButton.addEventListener("click", () => {
    loadMovies(currentEndpoint, currentPage + 1);
});


// Load trending movies when the page opens
loadMovies();