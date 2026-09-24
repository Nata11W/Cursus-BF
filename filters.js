// =========================================================
// CURSUS BF — filters.js
// Logique de filtrage et tri des établissements
// =========================================================

const FiltersManager = (() => {

  // ── Filtrer universités ──────────────────────────────────
  function filterUniversites(data, opts = {}) {
    return data.filter(u => {
      // Type
      if (opts.type && opts.type !== 'tous' && u.type !== opts.type) return false;
      // Localité
      if (opts.localite && opts.localite !== 'toutes' && !u.localite.toLowerCase().includes(opts.localite.toLowerCase()) && !u.quartier.toLowerCase().includes(opts.localite.toLowerCase())) return false;
      // Prix max
      if (opts.prixMax && u.prixMin > opts.prixMax) return false;
      // Filière
      if (opts.filiere && opts.filiere !== 'toutes') {
        const found = u.filieres.some(f => f.toLowerCase().includes(opts.filiere.toLowerCase()));
        if (!found) return false;
      }
      // Notation system
      if (opts.notation && opts.notation !== 'tous' && u.notationSystem !== opts.notation) return false;
      // Note minimale
      if (opts.noteMin && opts.noteMin > 0) {
        const avg = RatingsManager.getAverage(u.id);
        if (avg < opts.noteMin) return false;
      }
      // Recherche texte
      if (opts.search && opts.search.trim()) {
        const q = opts.search.toLowerCase();
        const match = u.nom.toLowerCase().includes(q) ||
          u.sigle.toLowerCase().includes(q) ||
          u.localite.toLowerCase().includes(q) ||
          u.quartier.toLowerCase().includes(q) ||
          u.filieres.some(f => f.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  // ── Filtrer lycées / collèges ────────────────────────────
  function filterEtablissements(data, opts = {}) {
    return data.filter(e => {
      // Type
      if (opts.type && opts.type !== 'tous' && e.type !== opts.type) return false;
      // Localité
      if (opts.localite && opts.localite !== 'toutes' && !e.localite.toLowerCase().includes(opts.localite.toLowerCase()) && !e.quartier.toLowerCase().includes(opts.localite.toLowerCase())) return false;
      // Prix max
      if (opts.prixMax && e.prixMin > opts.prixMax) return false;
      // Série
      if (opts.serie && opts.serie !== 'toutes') {
        const found = e.series.some(s => s.toLowerCase().includes(opts.serie.toLowerCase()));
        if (!found) return false;
      }
      // Notation system
      if (opts.notation && opts.notation !== 'tous' && e.notationSystem !== opts.notation) return false;
      // Note minimale
      if (opts.noteMin && opts.noteMin > 0) {
        const avg = RatingsManager.getAverage(e.id);
        if (avg < opts.noteMin) return false;
      }
      // Recherche texte
      if (opts.search && opts.search.trim()) {
        const q = opts.search.toLowerCase();
        const match = e.nom.toLowerCase().includes(q) ||
          e.sigle.toLowerCase().includes(q) ||
          e.localite.toLowerCase().includes(q) ||
          e.quartier.toLowerCase().includes(q) ||
          (e.series || []).some(s => s.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  // ── Trier ────────────────────────────────────────────────
  function sortEtablissements(data, sortBy) {
    const sorted = [...data];
    switch (sortBy) {
      case 'nom_asc':
        return sorted.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      case 'nom_desc':
        return sorted.sort((a, b) => b.nom.localeCompare(a.nom, 'fr'));
      case 'prix_asc':
        return sorted.sort((a, b) => a.prixMin - b.prixMin);
      case 'prix_desc':
        return sorted.sort((a, b) => b.prixMin - a.prixMin);
      case 'note_desc':
        return sorted.sort((a, b) => RatingsManager.getAverage(b.id) - RatingsManager.getAverage(a.id));
      case 'note_asc':
        return sorted.sort((a, b) => RatingsManager.getAverage(a.id) - RatingsManager.getAverage(b.id));
      default:
        return sorted;
    }
  }

  // ── Collecter les options de filtre depuis le DOM ────────
  function collectFilters(prefix = '') {
    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    const getNum = id => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) || 0 : 0;
    };

    return {
      type: get(`${prefix}filter-type`) || 'tous',
      localite: get(`${prefix}filter-localite`) || 'toutes',
      prixMax: getNum(`${prefix}filter-prix`),
      filiere: get(`${prefix}filter-filiere`) || 'toutes',
      serie: get(`${prefix}filter-serie`) || 'toutes',
      notation: get(`${prefix}filter-notation`) || 'tous',
      noteMin: getNum(`${prefix}filter-note`),
      search: get(`${prefix}search-input`) || '',
    };
  }

  // ── Lier les événements ──────────────────────────────────
  function bindFilterEvents(callback, prefix = '') {
    const ids = [
      `${prefix}filter-type`, `${prefix}filter-localite`,
      `${prefix}filter-prix`, `${prefix}filter-filiere`,
      `${prefix}filter-serie`, `${prefix}filter-notation`,
      `${prefix}filter-note`, `${prefix}search-input`
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', callback);
        el.addEventListener('change', callback);
      }
    });

    // Bouton reset
    const resetBtn = document.getElementById(`${prefix}btn-reset-filters`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
          } else if (el.type === 'range') {
            el.value = el.max;
            updatePriceDisplay(id, el.value, prefix);
          } else {
            el.value = '';
          }
        });
        // Reset rating buttons
        document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
        callback();
      });
    }

    // Boutons rating
    document.querySelectorAll('.rating-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          const noteEl = document.getElementById(`${prefix}filter-note`);
          if (noteEl) noteEl.value = 0;
        } else {
          document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const noteEl = document.getElementById(`${prefix}filter-note`);
          if (noteEl) noteEl.value = btn.dataset.min;
        }
        callback();
      });
    });

    // Mobile toggle
    const mobileToggle = document.getElementById(`${prefix}filter-mobile-toggle`);
    const filterPanel = document.getElementById(`${prefix}filter-panel`);
    if (mobileToggle && filterPanel) {
      mobileToggle.addEventListener('click', () => {
        filterPanel.classList.toggle('mobile-open');
        const isOpen = filterPanel.classList.contains('mobile-open');
        mobileToggle.querySelector('.toggle-text').textContent = isOpen ? 'Masquer les filtres' : 'Afficher les filtres';
      });
    }
  }

  // ── Mise à jour de l'affichage prix ──────────────────────
  function updatePriceDisplay(inputId, value, prefix = '') {
    const display = document.getElementById(`${prefix}prix-value`);
    if (display) {
      const formatted = parseInt(value).toLocaleString('fr-FR');
      display.textContent = value >= 2000000 ? 'Tous' : `≤ ${formatted} FCFA`;
    }
    // Gradient track
    const el = document.getElementById(inputId);
    if (el) {
      const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
      el.style.setProperty('--val', pct + '%');
    }
  }

  // ── Initialiser slider prix ──────────────────────────────
  function initPriceSlider(inputId, prefix = '') {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', () => updatePriceDisplay(inputId, el.value, prefix));
    updatePriceDisplay(inputId, el.value, prefix);
  }

  return { filterUniversites, filterEtablissements, sortEtablissements, collectFilters, bindFilterEvents, initPriceSlider, updatePriceDisplay };
})();
