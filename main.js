// ── MAIN APPLICATION ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';

  // Navbar Toggle
  setupNavbar();

  // Initialisation par page
  if (page === 'universites' || page === 'index') {
    renderSchools('universites');
    setupFilters('universites');
  } else if (page === 'lycees') {
    renderSchools('lycees');
    setupFilters('lycees');
  } else if (page === 'colleges') {
    renderSchools('colleges');
    setupFilters('colleges');
  }

  // Setup Modal Close
  setupModal();
}

function setupNavbar() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });
  }
}

// ── FILTRAGE ──────────────────────────────────────────────

function setupFilters(category) {
  if (typeof FiltersManager === 'undefined') return;

  const updateGrid = () => {
    const filters = FiltersManager.collectFilters();
    renderSchools(category, filters);
  };

  FiltersManager.bindFilterEvents(updateGrid);
  FiltersManager.initPriceSlider('filter-prix');
}

function filterSchools(schools, filters) {
  if (typeof FiltersManager === 'undefined') return schools;
  
  // Détecter si c'est une université ou un lycée/collège
  const isUni = schools.length > 0 && schools[0].filieres !== undefined;
  
  if (isUni) {
    return FiltersManager.filterUniversites(schools, filters);
  } else {
    return FiltersManager.filterEtablissements(schools, filters);
  }
}

// ── RENDU ─────────────────────────────────────────────────

function renderSchools(category, filterData = null) {
  const grid = document.getElementById('schools-grid');
  if (!grid) return;

  let schools = window.CURSUS_DATA[category];

  // Appliquer les filtres si présents
  if (filterData) {
    schools = filterSchools(schools, filterData);
  }

  grid.innerHTML = '';

  if (!schools || schools.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>Aucun établissement trouvé</h3>
        <p>Essayez de modifier vos critères de recherche.</p>
      </div>
    `;
    return;
  }

  schools.forEach(school => {
    const card = (category === 'universites' || (school.filieres && school.filieres.length > 0))
      ? renderUniversiteCard(school) 
      : renderLyceeCollegeCard(school);
    grid.appendChild(card);
  });
}

function renderUniversiteCard(u) {
  const ratingData = window.RatingsManager ? window.RatingsManager.getRating(u.id) : { average: 0, count: 0, userRating: 0 };
  const card = document.createElement('div');
  card.className = 'school-card';
  card.setAttribute('data-id', u.id);

  card.innerHTML = `
    <div class="card-header-img">
      <img src="${u.image}" alt="${u.nom}" loading="lazy">
      <div class="card-type-tag tag-${u.type}">${u.type}</div>
      <div class="card-logo-overlay">
        <img src="${u.logo}" alt="Logo ${u.sigle}">
      </div>
    </div>
    <div class="card-content">
      <div class="card-top">
        <div class="card-title-group">
          <h3>${u.nom}</h3>
          <span class="card-sigle">${u.sigle}</span>
        </div>
        <div class="card-rating-badge">
          ★ <span>${ratingData.average.toFixed(1)}</span>
        </div>
      </div>
      <div class="card-location">
        <span>📍</span> ${u.localite}, ${u.quartier}
      </div>
      <p class="card-description">${u.description}</p>
      <div class="card-tags">
        ${(u.filieres || []).slice(0, 3).map(f => `<span class="tag">${f}</span>`).join('')}
        ${(u.filieres || []).length > 3 ? `<span class="tag">+${(u.filieres || []).length - 3}</span>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-price">
          <span class="price-label">Frais scolarité</span>
          <span class="price-value">${u.prixLabel}</span>
        </div>
        <button class="btn-details" onclick="openDetails('${u.id}', 'universites')">Détails</button>
      </div>
    </div>
  `;
  return card;
}

function renderLyceeCollegeCard(s) {
  const ratingData = window.RatingsManager ? window.RatingsManager.getRating(s.id) : { average: 0, count: 0, userRating: 0 };
  const card = document.createElement('div');
  card.className = 'school-card';
  card.setAttribute('data-id', s.id);

  const isCollege = s.id.startsWith('c');
  const category = isCollege ? 'colleges' : 'lycees';

  card.innerHTML = `
    <div class="card-header-img">
      <img src="${s.image}" alt="${s.nom}" loading="lazy">
      <div class="card-type-tag tag-${s.type}">${s.type}</div>
      <div class="card-logo-overlay">
        <img src="${s.logo}" alt="Logo ${s.sigle}">
      </div>
    </div>
    <div class="card-content">
      <div class="card-top">
        <div class="card-title-group">
          <h3>${s.nom}</h3>
          <span class="card-sigle">${s.sigle}</span>
        </div>
        <div class="card-rating-badge">
          ★ <span>${ratingData.average.toFixed(1)}</span>
        </div>
      </div>
      <div class="card-location">
        <span>📍</span> ${s.localite}, ${s.quartier}
      </div>
      <p class="card-description">${s.description}</p>
      <div class="card-tags">
        ${(s.series || []).slice(0, 3).map(f => `<span class="tag">${f}</span>`).join('')}
      </div>
      <div class="card-footer">
        <div class="card-price">
          <span class="price-label">Frais scolarité</span>
          <span class="price-value">${s.prixLabel}</span>
        </div>
        <button class="btn-details" onclick="openDetails('${s.id}', '${category}')">Détails</button>
      </div>
    </div>
  `;
  return card;
}

// ── MODAL LOGIC ───────────────────────────────────────────

function setupModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetails();
    });
  }
}

function openDetails(id, category) {
  const school = window.CURSUS_DATA[category].find(s => s.id === id);
  if (!school) return;

  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-content-body');
  if (!overlay || !body) return;

  const ratingData = window.RatingsManager ? window.RatingsManager.getRating(id) : { average: 0, count: 0, userRating: 0 };
  const items = school.filieres || school.series || [];

  body.innerHTML = `
    <div class="modal-hero">
      <img src="${school.image}" alt="${school.nom}">
      <div class="modal-hero-content">
        <div class="modal-logo">
          <img src="${school.logo}" alt="Logo">
        </div>
        <div class="modal-title">
          <h2>${school.nom}</h2>
          <span class="modal-subtitle">${school.sigle} · ${school.localite}</span>
        </div>
      </div>
    </div>
    <div class="modal-main-content">
      <div class="modal-left">
        <div class="modal-section">
          <h3><span class="sec-icon">📝</span> Présentation</h3>
          <p class="modal-description">${school.descriptionDetaillee || school.description}</p>
        </div>
        <div class="modal-section">
          <h3><span class="sec-icon">📜</span> Toutes les filières / séries</h3>
          <div class="modal-filieres-grid">
            ${items.map(item => `<span class="filiere-pill">${item}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-right">
        <div class="modal-section">
          <h3><span class="sec-icon">ℹ️</span> Infos clés</h3>
          <div class="info-item">
            <div class="info-icon-box">💰</div>
            <div class="info-text-box">
              <span>Scolarité</span>
              <p>${school.prixLabel}</p>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon-box">📞</div>
            <div class="info-text-box">
              <span>Contact</span>
              <p>${school.telephone || 'Non renseigné'}</p>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon-box">🏢</div>
            <div class="info-text-box">
              <span>Type</span>
              <p>${school.type === 'public' ? 'Établissement Public' : 'Établissement Privé'}</p>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon-box">⭐</div>
            <div class="info-text-box">
              <span>Note moyenne</span>
              <p>${ratingData.average.toFixed(1)} / 5 (${ratingData.count} avis)</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          ${school.site ? `<a href="${school.site}" target="_blank" class="btn-modal-action btn-site">Visiter le site web</a>` : ''}
          <a href="https://wa.me/22600000000?text=Bonjour, j'aimerais plus d'informations sur ${school.nom}" target="_blank" class="btn-modal-action btn-wa-modal">Contacter sur WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetails() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global scope
window.openDetails = openDetails;
window.closeDetails = closeDetails;
