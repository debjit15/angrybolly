/* app.js - AngryBolly Modern Landing Page */

// PlayFab Configuration
const PLAYFAB_TITLE_ID = "16EA52";
const LEADERBOARD_STATISTIC = "HighScore";

// Initialize PlayFab
function initPlayFab() {
    if (typeof PlayFab !== 'undefined') {
        PlayFab.settings.titleId = PLAYFAB_TITLE_ID;
        loginPlayFabClient();
    } else {
        console.error("PlayFab SDK not loaded");
    }
}

// Login to PlayFab (Client Side)
function loginPlayFabClient() {
    const loginRequest = {
        TitleId: PLAYFAB_TITLE_ID,
        CustomId: "WebUser_" + Math.floor(Math.random() * 999999),
        CreateAccount: true
    };

    PlayFabClientSDK.LoginWithCustomID(loginRequest, (result, error) => {
        if (result) {
            console.log("PlayFab Login Success");
            fetchLeaderboard();
        } else {
            console.error("PlayFab Login Failed:", error);
            document.getElementById('leaderboard-list').innerHTML = '<div class="lb-error">Login failed. Unable to fetch scores.</div>';
        }
    });
}

// Fetch Leaderboard Data
function fetchLeaderboard() {
    const request = {
        StartPosition: 0,
        MaxResultsCount: 10,
        StatisticName: LEADERBOARD_STATISTIC
    };

    PlayFabClientSDK.GetLeaderboard(request, (result, error) => {
        if (result) {
            renderLeaderboard(result.data.Leaderboard);
        } else if (error) {
            console.error("PlayFab Leaderboard Error:", error);
            document.getElementById('leaderboard-list').innerHTML = '<div class="lb-error">Failed to load leaderboard.</div>';
        }
    });
}

// Render Leaderboard UI
function renderLeaderboard(data) {
    if (!data || data.length === 0) {
        document.getElementById('leaderboard-list').innerHTML = '<div class="lb-empty">No scores yet. Be the first!</div>';
        return;
    }

    // Top 3 Podium
    const top1 = data[0];
    if (top1) {
        document.getElementById('p1name').textContent = top1.DisplayName || top1.PlayFabId || "Anonymous";
        document.getElementById('p1score').textContent = top1.StatValue;
    }

    const top2 = data[1];
    if (top2) {
        document.getElementById('p2name').textContent = top2.DisplayName || top2.PlayFabId || "Anonymous";
        document.getElementById('p2score').textContent = top2.StatValue;
    }

    const top3 = data[2];
    if (top3) {
        document.getElementById('p3name').textContent = top3.DisplayName || top3.PlayFabId || "Anonymous";
        document.getElementById('p3score').textContent = top3.StatValue;
    }

    // List (Rank 4+)
    const listContainer = document.getElementById('leaderboard-list');
    listContainer.innerHTML = '';

    if (data.length > 3) {
        for (let i = 3; i < data.length; i++) {
            const player = data[i];
            const item = document.createElement('div');
            item.className = 'lb-item';

            item.innerHTML = `
                <div class="rank">${player.Position + 1}</div>
                <div class="player-info">
                    <span class="p-name">${player.DisplayName || player.PlayFabId || "Anonymous"}</span>
                </div>
                <div class="score">${player.StatValue}</div>
            `;
            listContainer.appendChild(item);
        }
    } else {
        listContainer.innerHTML = '<div class="lb-empty">Join the game to be on the list!</div>';
    }
}

/* ---------- Scroll Reveal Animations ---------- */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            scrollObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all scroll-reveal elements
document.addEventListener('DOMContentLoaded', () => {
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => scrollObserver.observe(el));
});

/* ---------- Navbar Scroll Effect ---------- */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

/* ---------- Mobile Menu Toggle ---------- */
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });
}

/* ---------- Smooth Scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

/* ---------- Modal Logic ---------- */
const modals = {
    leaderboard: document.getElementById('leaderboard-modal'),
    privacy: document.getElementById('privacy-modal'),
    contact: document.getElementById('contact-modal'),
    disclaimer: document.getElementById('disclaimer-modal')
};

const triggers = {
    leaderboard: document.getElementById('loadMoreBtn'),
    privacy: document.getElementById('privacy-link'),
    contact: document.getElementById('contact-link'),
    disclaimer: document.getElementById('disclaimer-link')
};

// Open Modal Function
function openModal(modalId) {
    const modal = modals[modalId];
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (modalId === 'leaderboard') {
            loadFullLeaderboard();
        }
    }
}

// Close Modal Function
function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Event Listeners for Triggers
if (triggers.leaderboard) {
    triggers.leaderboard.addEventListener('click', () => openModal('leaderboard'));
}
if (triggers.privacy) {
    triggers.privacy.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('privacy');
    });
}
if (triggers.contact) {
    triggers.contact.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('contact');
    });
}
if (triggers.disclaimer) {
    triggers.disclaimer.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('disclaimer');
    });
}

// Event Listeners for Close Buttons
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

// Close on Click Outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// Close on Escape Key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        Object.values(modals).forEach(modal => {
            if (modal && !modal.classList.contains('hidden')) {
                closeModal(modal);
            }
        });
    }
});

// Load Full Leaderboard
function loadFullLeaderboard() {
    const container = document.getElementById('full-leaderboard-list');
    container.innerHTML = '<div class="lb-loading">Fetching global rankings...</div>';

    const request = {
        StartPosition: 0,
        MaxResultsCount: 50,
        StatisticName: LEADERBOARD_STATISTIC
    };

    if (typeof PlayFabClientSDK !== 'undefined') {
        PlayFabClientSDK.GetLeaderboard(request, (result, error) => {
            if (result) {
                renderFullLeaderboard(result.data.Leaderboard);
            } else {
                container.innerHTML = '<div class="lb-error">Failed to load rankings.</div>';
            }
        });
    } else {
        container.innerHTML = '<div class="lb-error">PlayFab not initialized.</div>';
    }
}

function renderFullLeaderboard(data) {
    const container = document.getElementById('full-leaderboard-list');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="lb-empty">No players found.</div>';
        return;
    }

    data.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'lb-item';

        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        if (index === 1) rankClass = 'rank-2';
        if (index === 2) rankClass = 'rank-3';

        if (rankClass) item.classList.add(rankClass);

        item.innerHTML = `
            <div class="rank">${player.Position + 1}</div>
            <div class="player-info">
                <span class="p-name">${player.DisplayName || player.PlayFabId || "Anonymous"}</span>
            </div>
            <div class="score">${player.StatValue}</div>
        `;
        container.appendChild(item);
    });
}

/* ---------- Sprite Animation Logic ---------- */
const spriteContainer = document.getElementById('spriteContainer');
const spriteImage = document.getElementById('spriteImage');

if (spriteContainer && spriteImage) {
    const frames = [
        'assets/herosprite/fly1.png',
        'assets/herosprite/fly2.png',
        'assets/herosprite/fly3.png',
        'assets/herosprite/fly4.png'
    ];

    const idleFrame = 'assets/herosprite/fly4.png';
    let isAnimating = false;
    let currentFrame = 0;
    let animationInterval = null;

    // Click handler to start animation
    spriteContainer.addEventListener('click', () => {
        if (isAnimating) return; // Prevent multiple clicks during animation

        isAnimating = true;
        currentFrame = 0;

        // Animate through all frames
        animationInterval = setInterval(() => {
            spriteImage.src = frames[currentFrame];
            currentFrame++;

            // After cycling through all frames, return to idle
            if (currentFrame >= frames.length) {
                clearInterval(animationInterval);
                setTimeout(() => {
                    spriteImage.src = idleFrame;
                    isAnimating = false;
                }, 100); // Small delay before returning to idle
            }
        }, 100); // 100ms per frame = 400ms total animation
    });

    // Set initial idle state
    spriteImage.src = idleFrame;
}

/* ========================================
   DYNAMIC STATS & REVIEW SYSTEM
   ======================================== */
// API Configuration
const API_BASE = 'https://angrybolly.page.gd/api/'; // Adjust if needed
let currentReviewPage = 1;
let selectedRating = 0;
// Fetch and Update Stats
async function fetchGameStats() {
    try {
        const response = await fetch(API_BASE + 'stats.php');
        const stats = await response.json();

        // Update hero stats
        document.getElementById('stat-downloads').textContent = formatNumber(stats.downloads);
        document.getElementById('stat-rating').textContent = stats.rating + '★';
        document.getElementById('stat-reviews').textContent = formatNumber(stats.reviews);
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}
// Format numbers (1000000 -> 1M+)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num.toString();
}
// Fetch Reviews
async function fetchReviews(page = 1) {
    const container = document.getElementById('reviews-container');

    if (page === 1) {
        container.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';
    }

    try {
        const response = await fetch(API_BASE + `get-reviews.php?page=${page}`);
        const data = await response.json();

        if (page === 1) {
            container.innerHTML = '';
        }

        if (data.reviews.length === 0 && page === 1) {
            container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to review!</div>';
            return;
        }

        data.reviews.forEach(review => {
            const card = createReviewCard(review);
            container.appendChild(card);
        });

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
        if (data.page < data.totalPages) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        container.innerHTML = '<div class="reviews-error">Failed to load reviews.</div>';
    }
}
// Create Review Card
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card scroll-reveal';

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="review-header">
            <span class="review-author">${review.name}</span>
            <span class="review-stars">${stars}</span>
        </div>
        <p class="review-text">${review.review}</p>
        <span class="review-date">${date}</span>
    `;

    return card;
}
// Device Fingerprinting
function generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);

    const fingerprint = {
        canvas: canvas.toDataURL(),
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent
    };

    return btoa(JSON.stringify(fingerprint));
}
// Submit Review
async function submitReview(formData) {
    const messageEl = document.getElementById('reviewFormMessage');
    const submitBtn = document.querySelector('#reviewForm button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(API_BASE + 'submit-review.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                deviceId: generateDeviceFingerprint()
            })
        });

        const result = await response.json();

        if (result.success) {
            messageEl.className = 'form-message success';
            messageEl.textContent = result.message;
            document.getElementById('reviewForm').reset();
            selectedRating = 0;
            updateStarDisplay();

            // Refresh reviews and stats
            setTimeout(() => {
                closeModal(document.getElementById('review-modal'));
                fetchReviews(1);
                fetchGameStats();
            }, 2000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        messageEl.className = 'form-message error';
        messageEl.textContent = error.message || 'Failed to submit review. Please try again.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
    }
}
// Star Rating Logic
function updateStarDisplay() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    document.getElementById('reviewRating').value = selectedRating;
}
// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial data
    fetchGameStats();
    fetchReviews(1);

    // Write Review Button
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', () => {
            openModal('review');
        });
    }

    // Load More Reviews
    const loadMoreReviewsBtn = document.getElementById('loadMoreReviewsBtn');
    if (loadMoreReviewsBtn) {
        loadMoreReviewsBtn.addEventListener('click', () => {
            currentReviewPage++;
            fetchReviews(currentReviewPage);
        });
    }

    // Star Rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarDisplay();
        });
    });

    // Review Form Submit
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('reviewName').value,
                email: document.getElementById('reviewEmail').value,
                rating: parseInt(document.getElementById('reviewRating').value),
                review: document.getElementById('reviewText').value
            };

            if (formData.rating === 0) {
                alert('Please select a rating');
                return;
            }


            submitReview(formData);
        });
    }

    // Character Counter
    const reviewText = document.getElementById('reviewText');
    if (reviewText) {
        reviewText.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.querySelector('.char-count').textContent = `${count}/500`;
        });
    }

    // Download Tracking
    const downloadButtons = document.querySelectorAll('.download-buttons a');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await fetch(API_BASE + 'increment-download.php', { method: 'POST' });
            } catch (error) {
                console.error('Failed to track download:', error);
            }
        });
    });
});
// Update modal functions to include review modal
const reviewModal = document.getElementById('review-modal');
if (reviewModal) {
    modals.review = reviewModal;
}
// Initialize on Load
window.addEventListener('load', initPlayFab);
