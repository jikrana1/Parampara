document.addEventListener('DOMContentLoaded', async () => {
  await loadVillagePosts();
});

async function loadVillagePosts() {
  const DUMMY_POSTS = [
    {
      title: 'Warli Festival Begins in Palghar',
      village: 'Palghar, Maharashtra',
      timestamp: new Date().toISOString(),
      content:
        'The annual Warli harvest festival kicked off with traditional dance and painting ceremonies. Over 200 villagers participated.',
      type: 'Festival',
    },
    {
      title: 'New Pottery Workshop Opens',
      village: 'Khurja, Uttar Pradesh',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      content:
        'Local artisan Ramesh Kumhar has opened a free pottery workshop for village youth, teaching traditional blue pottery techniques.',
      type: 'Craft',
    },
    {
      title: 'Elder Storytelling Session Recorded',
      village: 'Bishnoi, Rajasthan',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      content:
        '90-year-old Dadi Kamla shared tales of the Bishnoi conservation movement — now archived in 3 languages.',
      type: 'Story',
    },
    {
      title: 'Heritage Bamboo Bridge Restored',
      village: 'Majuli, Assam',
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      content:
        'Community volunteers restored the 80-year-old bamboo bridge using traditional Mising tribe construction methods.',
      type: 'Restoration',
    },
    {
      title: 'Phad Painting Exhibition Next Week',
      village: 'Shahpura, Rajasthan',
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
      content:
        'Local Bhopa community is hosting a live Phad painting demo — a 700-year-old narrative scroll art tradition.',
      type: 'Art',
    },
    {
      title: 'Tribal Music Archive — 50 Songs Added',
      village: 'Bastar, Chhattisgarh',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      content:
        'Gond tribal musicians contributed 50 rare folk songs to the archive, many never recorded before.',
      type: 'Music',
    },
  ];

  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('API unavailable');
    const posts = await response.json();

    const postsGrid = document.getElementById('village-posts');
    if (!postsGrid) return;

    if (posts.length === 0) {
      renderPosts(postsGrid, DUMMY_POSTS, true);
      return;
    }

    renderPosts(postsGrid, posts.slice(0, 6), false);
  } catch (error) {
    console.error('Error loading posts:', error);
    const postsGrid = document.getElementById('village-posts');
    if (postsGrid) renderPosts(postsGrid, DUMMY_POSTS, true);
  }
}

function renderPosts(container, posts, isDummy) {
  container.innerHTML = posts
    .map(
      (post) => `
        <div class="post-card">
            <h4>${escapeHtml(post.title)}</h4>
            <p class="post-meta">${post.village} • ${formatDate(post.timestamp)}</p>
            <p>${escapeHtml(post.content)}</p>
            <span style="display: inline-block; padding: 0.25rem 0.75rem; background: var(--primary-color); border-radius: 20px; font-size: 0.85rem; margin-top: 1rem; color:white ">
                ${post.type}
            </span>
        </div>
    `
    )
    .join('');

  if (isDummy) {
    const note = document.createElement('p');
    note.style.cssText =
      'text-align:center; color: rgba(255,255,255,0.6); font-size:0.85rem; margin-top:1rem;';
    note.textContent = '✦ Sample stories — live updates coming soon';
    container.appendChild(note);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ===== Back to top button =====
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== Hamburger menu (single, clean version — no duplicates) =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');
let navOverlay = document.querySelector('.nav-overlay');

if (!navOverlay) {
  navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  document.body.appendChild(navOverlay);
}

function closeMenu() {
  if (hamburgerBtn) hamburgerBtn.classList.remove('open');
  if (navMenu) navMenu.classList.remove('open');
  if (navOverlay) navOverlay.classList.remove('open');
}

function openMenu() {
  if (hamburgerBtn) hamburgerBtn.classList.add('open');
  if (navMenu) navMenu.classList.add('open');
}

if (hamburgerBtn && navMenu) {
  const closeButtonExists = navMenu.querySelector('.mobile-menu-close');
  if (!closeButtonExists) {
    const closeItem = document.createElement('li');
    closeItem.className = 'close-item';
    closeItem.innerHTML =
      '<button class="mobile-menu-close" aria-label="Close navigation">✕</button>';
    navMenu.insertBefore(closeItem, navMenu.firstChild);
  }

  const closeBtn = navMenu.querySelector('.mobile-menu-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  hamburgerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!navMenu.classList.contains('open')) {
      openMenu();
    }
  });
}
