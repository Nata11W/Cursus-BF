// =========================================================
// CURSUS BF — ratings.js
// Système de notation ★/5 avec stockage localStorage
// =========================================================

const RatingsManager = (() => {
  const STORAGE_KEY = 'cursus_bf_ratings';

  // ── Sauvegarder une note ─────────────────────────────────
  function saveRating(schoolId, stars) {
    const all = getAllRatings();
    if (!all[schoolId]) {
      all[schoolId] = { total: 0, count: 0, userRated: false };
    }
    // Si déjà noté, mise à jour
    if (all[schoolId].userRated) {
      const oldVal = all[schoolId].userValue || 0;
      all[schoolId].total = all[schoolId].total - oldVal + stars;
    } else {
      all[schoolId].total += stars;
      all[schoolId].count += 1;
      all[schoolId].userRated = true;
    }
    all[schoolId].userValue = stars;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return getAverage(schoolId);
  }

  // ── Récupérer toutes les notes ───────────────────────────
  function getAllRatings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  // ── Moyenne d'un établissement ───────────────────────────
  function getAverage(schoolId) {
    const all = getAllRatings();
    if (!all[schoolId] || all[schoolId].count === 0) return 0;
    return all[schoolId].total / all[schoolId].count;
  }

  // ── Nombre de votes ──────────────────────────────────────
  function getCount(schoolId) {
    const all = getAllRatings();
    return all[schoolId] ? all[schoolId].count : 0;
  }

  // ── Note de l'utilisateur ────────────────────────────────
  function getUserRating(schoolId) {
    const all = getAllRatings();
    return all[schoolId] ? all[schoolId].userValue || 0 : 0;
  }

  // ── HTML des étoiles (affichage) ─────────────────────────
  function renderStarsDisplay(avg) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) {
        html += '<span class="star-icon filled">★</span>';
      } else if (avg >= i - 0.5) {
        html += '<span class="star-icon half">★</span>';
      } else {
        html += '<span class="star-icon">☆</span>';
      }
    }
    return html;
  }

  // ── HTML des étoiles interactives ─────────────────────────
  function renderRateStars(schoolId) {
    const userRating = getUserRating(schoolId);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<button
        class="rate-star ${i <= userRating ? 'selected' : ''}"
        data-school="${schoolId}"
        data-star="${i}"
        aria-label="Donner ${i} étoile${i > 1 ? 's' : ''}"
        title="${i} étoile${i > 1 ? 's' : ''}"
      >${i <= userRating ? '★' : '☆'}</button>`;
    }
    return html;
  }

  // ── Initialiser les listeners de notation ────────────────
  function initRatingListeners() {
    // Survol des étoiles
    document.addEventListener('mouseover', e => {
      const star = e.target.closest('.rate-star');
      if (!star) return;
      const val = parseInt(star.dataset.star);
      const schoolId = star.dataset.school;
      const container = star.closest('.rate-stars');
      if (!container) return;
      container.querySelectorAll('.rate-star').forEach((s, idx) => {
        s.classList.toggle('hovered', idx < val);
        s.textContent = idx < val ? '★' : '☆';
      });
    });

    // Quitter le survol
    document.addEventListener('mouseleave', e => {
      const container = e.target.closest('.rate-stars');
      if (!container) return;
      const schoolId = container.querySelector('.rate-star')?.dataset.school;
      const userRating = getUserRating(schoolId);
      container.querySelectorAll('.rate-star').forEach((s, idx) => {
        s.classList.remove('hovered');
        s.classList.toggle('selected', idx < userRating);
        s.textContent = idx < userRating ? '★' : '☆';
      });
    }, true);

    // Click pour noter
    document.addEventListener('click', e => {
      const star = e.target.closest('.rate-star');
      if (!star) return;
      const stars = parseInt(star.dataset.star);
      const schoolId = star.dataset.school;
      const avg = saveRating(schoolId, stars);
      const count = getCount(schoolId);

      // Mettre à jour l'affichage
      const card = star.closest('.school-card');
      if (card) {
        const starsDisplay = card.querySelector('.stars-visual');
        const ratingText = card.querySelector('.rating-text');
        const ratingCount = card.querySelector('.rating-count');
        if (starsDisplay) starsDisplay.innerHTML = renderStarsDisplay(avg);
        if (ratingText) ratingText.textContent = avg.toFixed(1) + '/5';
        if (ratingCount) ratingCount.textContent = `(${count} avis)`;

        // Mettre à jour les étoiles interactives
        const container = star.closest('.rate-stars');
        if (container) {
          container.querySelectorAll('.rate-star').forEach((s, idx) => {
            s.classList.toggle('selected', idx < stars);
            s.textContent = idx < stars ? '★' : '☆';
          });
        }
      }

      showToast(`⭐ Merci ! Vous avez noté cet établissement ${stars}/5`);
    });
  }

  return { saveRating, getAllRatings, getAverage, getCount, getUserRating, renderStarsDisplay, renderRateStars, initRatingListeners };
})();

// ── Toast notification ────────────────────────────────────
function showToast(message, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}
