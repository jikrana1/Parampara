// public/scripts/archive.js

class CommunityArchiveUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/archive';
    this.userId = this.getUserId();
    this.container = options.container || '#archive-container';
    this.currentView = 'browse';
    this.currentCategory = null;
    
    this.init();
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  init() {
    this.renderInterface();
    this.loadMemories();
    this.loadCategories();
    this.loadStats();
    this.setupEventListeners();
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="archive-interface">
        <!-- Header -->
        <div class="archive-header">
          <h2>📚 Community Cultural Archive</h2>
          <div class="archive-actions">
            <button id="btn-submit-memory" class="btn btn-primary">
              ➕ Share Memory
            </button>
            <button id="btn-view-queue" class="btn btn-secondary">
              📋 Verification Queue
            </button>
            <button id="btn-refresh" class="btn btn-info">
              🔄 Refresh
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="archive-stats" id="archive-stats">
          <!-- Stats will be loaded here -->
        </div>

        <!-- Categories -->
        <div class="archive-categories" id="archive-categories">
          <!-- Categories will be loaded here -->
        </div>

        <!-- Search & Filters -->
        <div class="archive-filters">
          <input type="text" id="archive-search" placeholder="🔍 Search archive..." />
          <select id="archive-sort">
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        <!-- Memories Grid -->
        <div class="memories-grid" id="memories-grid">
          <!-- Memories will be loaded here -->
        </div>

        <!-- Modal for submitting memory -->
        <div class="modal" id="submit-memory-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>📝 Share Your Memory</h3>
            <form id="memory-form">
              <div class="form-group">
                <label>Title *</label>
                <input type="text" id="memory-title" required />
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea id="memory-description" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select id="memory-category" required>
                  <option value="">Select category...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Content</label>
                <input type="text" id="memory-text" placeholder="Story text..." />
                <input type="file" id="memory-files" multiple accept="image/*,audio/*,video/*,pdf/*" />
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" id="memory-location" placeholder="Where is this memory from?" />
              </div>
              <div class="form-group">
                <label>Tags</label>
                <input type="text" id="memory-tags" placeholder="Separate tags with commas" />
              </div>
              <button type="submit" class="btn btn-primary">Submit Memory</button>
            </form>
          </div>
        </div>

        <!-- Modal for viewing memory -->
        <div class="modal" id="memory-view-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <div id="memory-details">
              <!-- Memory details will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadMemories(filters = {}) {
    const grid = document.getElementById('memories-grid');
    if (!grid) return;

    this.setLoading(grid, true);

    try {
      const params = new URLSearchParams({
        ...filters,
        sortBy: document.getElementById('archive-sort')?.value || 'recent'
      });
      const response = await fetch(`${this.apiBase}/memories?${params}`);
      const data = await response.json();

      if (data.success) {
        this.renderMemories(grid, data.memories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      grid.innerHTML = '<p class="error">❌ Failed to load memories</p>';
    } finally {
      this.setLoading(grid, false);
    }
  }

  renderMemories(grid, memories) {
    if (!memories || memories.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>📭 No memories in the archive yet</p>
          <p style="color: #666; font-size: 14px;">Be the first to share a memory!</p>
          <button onclick="document.getElementById('btn-submit-memory').click()" class="btn btn-primary">
            Share Memory
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = `
      <div class="memories-grid-layout">
        ${memories.map(memory => this.renderMemoryCard(memory)).join('')}
      </div>
    `;
  }

  renderMemoryCard(memory) {
    const statusColors = {
      'verified': '#4CAF50',
      'pending_verification': '#FF9800',
      'rejected': '#f44336'
    };

    const category = this.getCategoryName(memory.category);

    return `
      <div class="memory-card" data-memory-id="${memory.id}" style="
        background: white;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: transform 0.3s;
        cursor: pointer;
        border-left: 4px solid ${statusColors[memory.status] || '#4CAF50'};
      ">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <h4 style="margin: 0 0 5px 0;">${memory.title}</h4>
          <span style="
            font-size: 11px;
            background: ${statusColors[memory.status] || '#4CAF50'};
            color: white;
            padding: 2px 10px;
            border-radius: 12px;
          ">${memory.status}</span>
        </div>
        <p style="color: #666; font-size: 14px; margin: 5px 0;">${memory.description}</p>
        <div style="display: flex; gap: 10px; font-size: 12px; color: #888;">
          <span>📂 ${category || 'Uncategorized'}</span>
          <span>👍 ${memory.votes.up || 0}</span>
          <span>👁️ ${memory.views || 0}</span>
          <span>📅 ${new Date(memory.submittedAt).toLocaleDateString()}</span>
        </div>
        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
          ${memory.tags ? memory.tags.map(tag => 
            `<span style="background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${tag}</span>`
          ).join('') : ''}
        </div>
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button onclick="event.stopPropagation(); window.archiveUI.voteMemory('${memory.id}', 'up')" style="
            padding: 4px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">👍</button>
          <button onclick="event.stopPropagation(); window.archiveUI.voteMemory('${memory.id}', 'down')" style="
            padding: 4px 12px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">👎</button>
        </div>
      </div>
    `;
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBase}/categories`);
      const data = await response.json();

      if (data.success) {
        this.renderCategories(data.categories);
        this.populateCategorySelect(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderCategories(categories) {
    const container = document.getElementById('archive-categories');
    if (!container) return;

    container.innerHTML = `
      <div class="category-tabs">
        <button class="category-tab active" data-category="all">All</button>
        ${categories.map(cat => `
          <button class="category-tab" data-category="${cat.id}">${cat.icon} ${cat.name}</button>
        `).join('')}
      </div>
    `;

    // Category click handler
    container.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const category = tab.dataset.category;
        this.currentCategory = category === 'all' ? null : category;
        this.loadMemories({ category: this.currentCategory });
      });
    });
  }

  populateCategorySelect(categories) {
    const select = document.getElementById('memory-category');
    if (!select) return;

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.name}`;
      select.appendChild(option);
    });
  }

  getCategoryName(categoryId) {
    const categories = document.querySelectorAll('#memory-category option');
    for (const option of categories) {
      if (option.value === categoryId) {
        return option.textContent;
      }
    }
    return categoryId;
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      const data = await response.json();

      if (data.success) {
        this.renderStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  renderStats(stats) {
    const container = document.getElementById('archive-stats');
    if (!container) return;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalMemories || 0}</div>
          <div class="stat-label">Total Memories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.verifiedMemories || 0}</div>
          <div class="stat-label">Verified</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.pendingVerification || 0}</div>
          <div class="stat-label">Pending Review</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalVotes || 0}</div>
          <div class="stat-label">Total Votes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.exhibitions || 0}</div>
          <div class="stat-label">Exhibitions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.storage?.totalSize || 0} GB</div>
          <div class="stat-label">Storage Used</div>
        </div>
      </div>
    `;
  }

  async voteMemory(memoryId, voteType) {
    try {
      const response = await fetch(`${this.apiBase}/memory/${memoryId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, voteType })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(`✅ Vote recorded!`, 'success');
        this.loadMemories({ category: this.currentCategory });
      }
    } catch (error) {
      console.error('Error voting:', error);
      this.showToast('❌ Error voting', 'error');
    }
  }

  async submitMemory(event) {
    event.preventDefault();

    const formData = {
      title: document.getElementById('memory-title').value,
      description: document.getElementById('memory-description').value,
      category: document.getElementById('memory-category').value,
      content: {
        text: document.getElementById('memory-text').value
      },
      metadata: {
        location: document.getElementById('memory-location').value
      },
      tags: document.getElementById('memory-tags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      const response = await fetch(`${this.apiBase}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryData: formData,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Memory submitted! It will be reviewed soon.', 'success');
        document.getElementById('submit-memory-modal').style.display = 'none';
        this.loadMemories({ category: this.currentCategory });
        document.getElementById('memory-form').reset();
      }
    } catch (error) {
      console.error('Error submitting memory:', error);
      this.showToast('❌ Error submitting memory', 'error');
    }
  }

  setupEventListeners() {
    // Submit memory button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-submit-memory' || e.target.closest('#btn-submit-memory')) {
        document.getElementById('submit-memory-modal').style.display = 'flex';
      }
    });

    // Close modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || e.target.closest('.modal')?.style?.display === 'flex' && e.target === e.target.closest('.modal')) {
        e.target.closest('.modal').style.display = 'none';
      }
    });

    // Memory form submit
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'memory-form') {
        e.preventDefault();
        this.submitMemory(e);
      }
    });

    // Search
    document.addEventListener('input', (e) => {
      if (e.target.id === 'archive-search') {
        const search = e.target.value;
        this.loadMemories({ search: search || undefined });
      }
    });

    // Sort
    document.addEventListener('change', (e) => {
      if (e.target.id === 'archive-sort') {
        this.loadMemories({ category: this.currentCategory });
      }
    });

    // Refresh
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-refresh' || e.target.closest('#btn-refresh')) {
        this.loadMemories({ category: this.currentCategory });
        this.loadStats();
        this.showToast('🔄 Refreshed', 'info');
      }
    });

    // Memory card click
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.memory-card');
      if (card && !e.target.closest('button')) {
        const memoryId = card.dataset.memoryId;
        this.viewMemory(memoryId);
      }
    });
  }

  async viewMemory(memoryId) {
    try {
      const response = await fetch(`${this.apiBase}/memory/${memoryId}`);
      const data = await response.json();

      if (data.success) {
        this.showMemoryDetails(data.memory);
      }
    } catch (error) {
      console.error('Error viewing memory:', error);
    }
  }

  showMemoryDetails(memory) {
    const modal = document.getElementById('memory-view-modal');
    const details = document.getElementById('memory-details');
    
    if (!modal || !details) return;

    details.innerHTML = `
      <h3>${memory.title}</h3>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0;">
        <span style="background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${memory.category}</span>
        <span style="background: ${memory.status === 'verified' ? '#e8f5e9' : '#fff3e0'}; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${memory.status}</span>
        <span>📅 ${new Date(memory.submittedAt).toLocaleDateString()}</span>
      </div>
      <p><strong>Description:</strong> ${memory.description}</p>
      ${memory.content.text ? `<p><strong>Story:</strong> ${memory.content.text}</p>` : ''}
      ${memory.content.audio ? `<p><strong>Audio:</strong> <audio controls src="${memory.content.audio}"></audio></p>` : ''}
      ${memory.content.images ? `<p><strong>Images:</strong></p><div style="display: flex; gap: 10px; flex-wrap: wrap;">${memory.content.images.map(img => `<img src="${img}" style="max-height: 200px; border-radius: 8px;" />`).join('')}</div>` : ''}
      ${memory.metadata?.location ? `<p><strong>Location:</strong> ${memory.metadata.location}</p>` : ''}
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button onclick="window.archiveUI.voteMemory('${memory.id}', 'up')" style="padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">👍 ${memory.votes.up}</button>
        <button onclick="window.archiveUI.voteMemory('${memory.id}', 'down')" style="padding: 8px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">👎 ${memory.votes.down}</button>
        <button onclick="this.closest('.modal').style.display='none'" style="padding: 8px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
      </div>
    `;

    modal.style.display = 'flex';
  }

  setLoading(container, isLoading) {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px;">Loading...</p>
        </div>
      `;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const archiveUI = new CommunityArchiveUI({
    container: '#archive-container'
  });
  window.archiveUI = archiveUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .archive-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .archive-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
  .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .stat-value { font-size: 2em; font-weight: bold; color: #2E7D32; }
  .category-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
  .category-tab { padding: 8px 16px; border: none; border-radius: 20px; background: #f0f0f0; cursor: pointer; transition: background 0.3s; }
  .category-tab:hover { background: #e0e0e0; }
  .category-tab.active { background: #4CAF50; color: white; }
  .archive-filters { display: flex; gap: 15px; margin: 15px 0; flex-wrap: wrap; }
  .archive-filters input, .archive-filters select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; min-width: 200px; }
  .memories-grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px; margin: 20px 0; }
  .memory-card:hover { transform: translateY(-3px); box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; }
  .modal-close:hover { color: #333; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
  .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
  .form-group textarea { resize: vertical; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  .empty-state { text-align: center; padding: 60px; color: #666; }
  .error { text-align: center; padding: 40px; color: #f44336; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .archive-header { flex-direction: column; align-items: stretch; }
    .archive-actions { justify-content: stretch; }
    .archive-actions .btn { flex: 1; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .memories-grid-layout { grid-template-columns: 1fr; }
    .modal-content { width: 95%; padding: 20px; }
  }
`;
document.head.appendChild(style);