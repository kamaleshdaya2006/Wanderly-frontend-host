/* ================= DOM REFERENCES ================= */

const panel = document.getElementById("panel");
const overlay = document.getElementById("overlay");

const guideContainer = document.getElementById("guideContainer");

const guideModal = document.getElementById("guideModal");
const modalOverlay = document.getElementById("modalOverlay");

const bookingModal = document.getElementById("bookingModal");
const bookingOverlay = document.getElementById("bookingOverlay");

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const cityEl = document.getElementById("city");

const g_name = document.getElementById("g_name");
const g_desc = document.getElementById("g_desc");
const g_lang = document.getElementById("g_lang");
const g_price = document.getElementById("g_price");
const g_image = document.getElementById("g_image");

let selectedGuideId = null;

/* ================= NAV ================= */

function goHome() {
    window.location.href = "chennaimain.html";
}

/* ================= PROFILE ================= */

function openProfile() {
    panel.classList.add("active");
    overlay.classList.add("active");
}

function closeProfile() {
    panel.classList.remove("active");
    overlay.classList.remove("active");
}

overlay.addEventListener("click", closeProfile);

/* ================= LOAD PROFILE ================= */

function loadProfile() {
    const userData = localStorage.getItem("user");

    if (!userData) {
        window.location.href = "signin.html";
        return;
    }

    const user = JSON.parse(userData);

    nameEl.textContent = user.name;
    emailEl.textContent = user.email;
    cityEl.textContent = user.city;
}

/* ================= LOAD GUIDES ================= */

function loadGuides() {
    fetch("http://localhost:5000/guides")
        .then(res => {
            if (!res.ok) throw new Error("Failed to load guides");
            return res.json();
        })
        .then(data => {
            guideContainer.innerHTML = "";

            data.forEach(g => {
                const card = document.createElement("div");
                card.className = "guide-card";

                const imgSrc = g.image
                    ? `http://localhost:5000/static/uploads/${g.image}`
                    : "https://via.placeholder.com/100";

                card.innerHTML = `
                    <img src="${imgSrc}" class="guide-img">

                    <div class="guide-info">
                        <h3>${g.name}</h3>

                        <div class="rating">
                            <i class="fa-solid fa-star"></i> ${g.rating || 4.5}
                        </div>

                        <p>${g.description}</p>

                        <div class="guide-meta">
                            <span>${g.languages}</span>
                            <span>₹${g.price}/day</span>
                        </div>

                        <div class="review-section" id="reviews-guide-${g.guide_id}">
                            <p>Loading reviews...</p>
                        </div>

                        <button class="book-btn">Book Guide</button>
                    </div>
                `;

                // ✅ FIX: Only button triggers booking
                card.querySelector(".book-btn").onclick = (e) => {
                    e.stopPropagation();
                    openBookingModal(g.guide_id, g.name);
                };

                guideContainer.appendChild(card);

                // ✅ Load reviews
                loadReviews("guide", g.guide_id, `reviews-guide-${g.guide_id}`);
            });
        })
        .catch(err => {
            console.error(err);
            guideContainer.innerHTML = "<p>Error loading guides</p>";
        });
}

/* ================= APPLY GUIDE MODAL ================= */

function openGuideModal() {
    guideModal.classList.add("active");
    modalOverlay.classList.add("active");
}

function closeGuideModal() {
    guideModal.classList.remove("active");
    modalOverlay.classList.remove("active");
}

modalOverlay.addEventListener("click", closeGuideModal);

/* ================= SUBMIT GUIDE ================= */

function submitGuide() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Login required");
        return;
    }

    if (!g_name.value || !g_desc.value || !g_lang.value || !g_price.value) {
        alert("Fill all fields");
        return;
    }

    const formData = new FormData();

    formData.append("name", g_name.value);
    formData.append("description", g_desc.value);
    formData.append("languages", g_lang.value);
    formData.append("price", g_price.value);
    formData.append("user_id", user.user_id);

    if (g_image && g_image.files.length > 0) {
        formData.append("image", g_image.files[0]);
    }

    fetch("http://localhost:5000/guides", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(() => {
        alert("Guide submitted!");
        closeGuideModal();
        loadGuides();
    })
    .catch(err => {
        console.error(err);
        alert("Failed");
    });
}

/* ================= BOOKING ================= */

function openBookingModal(guideId, guideName) {
    selectedGuideId = guideId;

    document.getElementById("selectedGuideName").textContent =
        "Guide: " + guideName;

    bookingModal.classList.add("active");
    bookingOverlay.classList.add("active");

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("bookingDate").setAttribute("min", today);
}

function closeBookingModal() {
    bookingModal.classList.remove("active");
    bookingOverlay.classList.remove("active");
}

bookingOverlay.addEventListener("click", closeBookingModal);

/* ================= CONFIRM BOOKING ================= */

function confirmBooking() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Login required");
        return;
    }

    const date = document.getElementById("bookingDate").value;

    if (!date) {
        alert("Select a date");
        return;
    }

    fetch("http://localhost:5000/guide-bookings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: user.user_id,
            guide_id: selectedGuideId,
            booking_date: date
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Guide booked!");
        closeBookingModal();
    })
    .catch(err => {
        console.error(err);
        alert("Booking failed");
    });
}

/* ================= REVIEWS ================= */

function loadReviews(entityType, entityId, containerId) {
    fetch(`http://localhost:5000/reviews?entity_type=${entityType}&entity_id=${entityId}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch reviews");
            return res.json();
        })
        .then(data => {
            const container = document.getElementById(containerId);

            if (!data.length) {
                container.innerHTML = "<p class='no-review'>No reviews yet</p>";
                return;
            }

            container.innerHTML = "";

            data.forEach(r => {
                const div = document.createElement("div");
                div.classList.add("review-card");

                div.innerHTML = `
                    <div class="review-rating">⭐ ${r.rating || "-"}</div>
                    <div class="review-text">${r.review_text}</div>
                    <div class="review-date">
                        ${new Date(r.created_at).toLocaleDateString()}
                    </div>
                `;

                container.appendChild(div);
            });
        })
        .catch(() => {
            document.getElementById(containerId).innerHTML =
                "<p class='error'>Error loading reviews</p>";
        });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadGuides();
});