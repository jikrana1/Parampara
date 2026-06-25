// Favorites Page JavaScript

let allFavoriteItems = [];

document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  setupItemModal();
  setupFavDelegation();
});

// ── Event delegation: one listener handles all heart-button clicks
function setupFavDelegation() {
  const grid = document.getElementById('favorites-grid');
  // Grid may be empty on load; use document-level delegation
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#favorites-grid .favorite-btn');
    if (!btn) return;
    e.stopPropagation();

    const itemId = btn.dataset.itemId;
    if (!itemId) return;

    const fm = window.FavoritesManager;
    if (!fm) return;

    fm.removeFavorite(itemId);   // on favorites page, button always removes

    // Animate card out
    const card = btn.closest('.gallery-item');
    if (card) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        allFavoriteItems = allFavoriteItems.filter(i => i.id !== itemId);
        displayFavorites(allFavoriteItems);
      }, 300);
    }
    console.log('[Parampara] Removed favorite:', itemId);
  });
}

// Re-render when language or favorites change
window.addEventListener('parampara:langchange', loadFavorites);
window.addEventListener('favoritesUpdated', loadFavorites);

async function loadFavorites() {
  try {
    const response = await fetch('/api/items');
    const allItems = await response.json();

    // Filter to only include favorited items
    const favIds = typeof FavoritesManager !== 'undefined' ? FavoritesManager.getFavorites() : [];
    allFavoriteItems = allItems.filter(item => favIds.includes(item.id));

    displayFavorites(allFavoriteItems);
  } catch (error) {
    console.error('Error loading favorites:', error);
    displayFavorites([]);
  }
}

// ── Translation helper
function tGallery(key) {
  if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;
  const lang =
    localStorage.getItem('parampara_lang') ||
    localStorage.getItem('language') ||
    'en';
  const dict = PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS['en'];
  return (dict && dict[key]) || PARAMPARA_TRANSLATIONS['en'][key] || key;
}

function translateType(type) {
  const keyMap = {
    visual: 'modal_type_visual',
    audio: 'modal_type_audio',
    story: 'modal_type_story',
  };
  return tGallery(keyMap[type] || type);
}

function getTypeIcon(type) {
  const icons = { visual: '🖼️', audio: '🎧', story: '📖' };
  return icons[type] || '📄';
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  const div = document.createElement('div');
  div.textContent = String(unsafe);
  return div.innerHTML;
}

function getEmptyFavoritesHtml() {
  return `
    <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="ti ti-heart-broken"></i>
        <h3>No favorites yet!</h3>
        <p>You haven't saved any cultural items to your favorites.</p>
        <a href="gallery.html" class="btn-primary">Explore Gallery</a>
    </div>
  `;
}

const HEART_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const HEART_EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

function displayFavorites(items) {
  const favoritesGrid = document.getElementById('favorites-grid');

  if (!items || items.length === 0) {
    favoritesGrid.innerHTML = getEmptyFavoritesHtml();
    return;
  }

  favoritesGrid.innerHTML = items
    .map((item) => {
      const isFav = !!(window.FavoritesManager && window.FavoritesManager.isFavorite(item.id));
      const heartSvg = HEART_FILLED_SVG; // On favorites page, all items are favorited

      return `
        <div class="gallery-item" data-id="${escapeHtml(item.id)}" data-item-id="${escapeHtml(item.id)}" onclick="viewItem('${escapeHtml(item.id)}')">
            <div class="gallery-item-image" style="position:relative;">
                ${
                  item.imageUrl
                    ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<span>${getTypeIcon(item.type)}</span>`
                }
                <button
                  class="favorite-btn favorited"
                  data-item-id="${escapeHtml(item.id)}"
                  aria-label="Remove from Favorites"
                  title="Remove from favorites"
                >
                    ${heartSvg}
                </button>
            </div>
            <div class="gallery-item-content">
                <span class="gallery-item-type">${translateType(item.type)}</span>
                <div class="gallery-item-location">
                    <span class="gallery-item-location-marker">📍</span> <strong>${escapeHtml(item.location)}</strong>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description.substring(0, 100))}${item.description.length > 100 ? '...' : ''}</p>
                ${
                  item.tags && item.tags.length > 0
                    ? `
                    <div class="gallery-item-tags">
                        ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
    })
    .join('');
}


/* ── Favorite toggle without full page reload ── */
function toggleFav(itemId, btnEl) {
  if (typeof FavoritesManager === 'undefined') return;
  FavoritesManager.toggleFavorite(itemId);

  const isFav = FavoritesManager.isFavorite(itemId);
  btnEl.innerHTML = isFav ? HEART_FILLED_SVG : HEART_EMPTY_SVG;
  btnEl.title = isFav ? 'Remove from favorites' : 'Add to favorites';
  btnEl.classList.toggle('favorited', isFav);

  // If item was un-favorited on the favorites page, remove the card
  if (!isFav) {
    const card = document.querySelector(`.gallery-item[data-id="${itemId}"]`);
    if (card) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        allFavoriteItems = allFavoriteItems.filter(i => i.id !== itemId);
        displayFavorites(allFavoriteItems);
      }, 300);
    }
  }
}

/* ── Item Detail Modal ── */
function setupItemModal() {
  // Create modal if it doesn't exist
  if (document.getElementById('fav-item-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'fav-item-modal';
  modal.className = 'fav-modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'fav-modal-title');
  modal.innerHTML = `
    <div class="fav-modal-card">
      <button class="fav-modal-close" id="fav-modal-close-btn" aria-label="Close">✕</button>
      <div class="fav-modal-image" id="fav-modal-image"></div>
      <div class="fav-modal-body">
        <span class="fav-modal-type" id="fav-modal-type"></span>
        <h2 id="fav-modal-title"></h2>
        <div class="fav-modal-location" id="fav-modal-location"></div>
        <p id="fav-modal-desc"></p>
        <div class="fav-modal-tags" id="fav-modal-tags"></div>
        <div class="fav-modal-actions">
          <a href="gallery.html" class="btn-primary" id="fav-modal-gallery-link">View in Gallery</a>
          <button class="fav-modal-remove-btn" id="fav-modal-remove-btn">
            <i class="ti ti-heart-off"></i> Remove from Favorites
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('fav-modal-close-btn').addEventListener('click', closeItemModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeItemModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeItemModal();
  });
}

function viewItem(id) {
  const item = allFavoriteItems.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('fav-item-modal');
  if (!modal) return;

  // Populate image area
  const imageEl = document.getElementById('fav-modal-image');
  imageEl.innerHTML = item.imageUrl
    ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}">`
    : `<span class="fav-modal-icon">${getTypeIcon(item.type)}</span>`;

  document.getElementById('fav-modal-type').textContent = translateType(item.type);
  document.getElementById('fav-modal-title').textContent = item.title;
  document.getElementById('fav-modal-location').innerHTML = `📍 <strong>${escapeHtml(item.location)}</strong>`;
  document.getElementById('fav-modal-desc').textContent = item.description;

  // Tags
  const tagsEl = document.getElementById('fav-modal-tags');
  tagsEl.innerHTML = item.tags && item.tags.length > 0
    ? item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    : '';

  // Remove button
  const removeBtn = document.getElementById('fav-modal-remove-btn');
  removeBtn.onclick = () => {
    if (typeof FavoritesManager !== 'undefined') {
      FavoritesManager.removeFavorite(item.id);
    }
    closeItemModal();
    // Re-load to reflect removal
    loadFavorites();
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeItemModal() {
  const modal = document.getElementById('fav-item-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
