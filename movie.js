// MovieMuse: movie details page

const API_KEY = "0e0e8cfa14085c9c992455baa9e7db57";
const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";

const detailsBox = document.getElementById("movieDetails");
const movieId = new URLSearchParams(window.location.search).get("id");

function getWatchlist() {
    try {
        return JSON.parse(localStorage.getItem("movieMuseList")) || [];
    } catch {
        return [];
    }
}

function saveWatchlist(list) {
    localStorage.setItem("movieMuseList", JSON.stringify(list));
}

function isSaved(id) {
    return getWatchlist().some(m => m.id === id);
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function loadDetails() {
    if (!movieId) {
        detailsBox.innerHTML =
            '<p class="details-status">No movie selected. <a href="index.html">Go back home</a>.</p>';
        return;
    }

    try {
        const url = `${API_URL}/movie/${encodeURIComponent(movieId)}` +
            `?api_key=${API_KEY}&append_to_response=videos,credits`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDB returned status ${response.status}`);
        }

        showDetails(await response.json());

    } catch (error) {
        console.error("Details error:", error);
        detailsBox.innerHTML =
            `<p class="details-status">Unable to load this movie: ${escapeHTML(error.message)}</p>`;
    }
}

function showDetails(movie) {
    document.title = `${movie.title} | MovieMuse`;

    const poster = movie.poster_path
        ? `${IMAGE_URL}${movie.poster_path}`
        : "https://placehold.co/500x750/292929/ffffff?text=No+Poster";

    const year = movie.release_date ? movie.release_date.slice(0, 4) : "Date unavailable";
    const rating = Number(movie.vote_average || 0).toFixed(1);
    const runtime = movie.runtime ? `${movie.runtime} min` : "";
    const genres = (movie.genres || []).map(g => g.name).join(", ");

    const cast = ((movie.credits && movie.credits.cast) || [])
        .slice(0, 6)
        .map(person => person.name)
        .join(", ");

    const videos = (movie.videos && movie.videos.results) || [];
    const trailer =
        videos.find(v => v.site === "YouTube" && v.type === "Trailer") ||
        videos.find(v => v.site === "YouTube");

    const backdrop = movie.backdrop_path
        ? `style="background-image: linear-gradient(rgba(16,16,16,0.82), #101010), url('${BACKDROP_URL}${movie.backdrop_path}')"`
        : "";

    detailsBox.innerHTML = `
        <section class="details-hero" ${backdrop}>
            <img class="details-poster" src="${poster}" alt="${escapeHTML(movie.title)} movie poster">

            <div class="details-text">
                <h1>${escapeHTML(movie.title)}</h1>
                ${movie.tagline ? `<p class="details-tagline">${escapeHTML(movie.tagline)}</p>` : ""}

                <p class="details-meta">
                    <span class="movie-rating">★ ${rating}/10</span>
                    <span>${year}</span>
                    ${runtime ? `<span>${runtime}</span>` : ""}
                </p>

                ${genres ? `<p class="details-genres">${escapeHTML(genres)}</p>` : ""}

                <p class="details-overview">
                    ${escapeHTML(movie.overview || "No description available yet.")}
                </p>

                ${cast ? `<p class="details-cast"><strong>Cast:</strong> ${escapeHTML(cast)}</p>` : ""}

                <div class="hero-buttons">
                    <button id="listButton" class="btn btn-primary" type="button"></button>
                    <a href="index.html" class="btn btn-secondary">Back to movies</a>
                </div>
            </div>
        </section>

        ${trailer ? `
        <section class="trailer-section">
            <h2>Trailer</h2>
            <div class="trailer-frame">
                <iframe
                    src="https://www.youtube.com/embed/${encodeURIComponent(trailer.key)}"
                    title="${escapeHTML(movie.title)} trailer"
                    allowfullscreen></iframe>
            </div>
        </section>` : ""}
    `;

    setupListButton(movie);
}

function setupListButton(movie) {
    const button = document.getElementById("listButton");

    function updateLabel() {
        button.textContent = isSaved(movie.id) ? "Remove from My List" : "Add to My List";
    }

    button.addEventListener("click", () => {
        let list = getWatchlist();

        if (isSaved(movie.id)) {
            list = list.filter(m => m.id !== movie.id);
        } else {
            list.push({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date
            });
        }

        saveWatchlist(list);
        updateLabel();
    });

    updateLabel();
}

loadDetails();