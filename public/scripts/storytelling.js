// public/scripts/storytelling.js

class StorytellingUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/story';
    this.userId = this.getUserId();
    this.container = options.container || '#storytelling-container';
    this.currentStory = null;
    this.currentBranch = null;
    this.storyHistory = [];
    
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
    this.loadStories();
    this.loadThemes();
    this.loadAnalytics();
    this.setupEventListeners();
    console.log('✅ Storytelling UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="storytelling-interface">
        <div class="storytelling-header">
          <h2>📖 Heritage Storytelling</h2>
          <div class="storytelling-actions">
            <button id="btn-generate" class="btn btn-primary">✨ Generate Story</button>
            <button id="btn-create" class="btn btn-secondary">✍️ Create Story</button>
            <button id="btn-analytics" class="btn btn-info">📊 Analytics</button>
          </div>
        </div>

        <!-- Generate Modal -->
        <div class="modal" id="generate-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>✨ Generate AI Story</h3>
            <form id="generate-form">
              <div class="form-group">
                <label>Prompt / Theme *</label>
                <input type="text" id="story-prompt" placeholder="Enter a topic or theme..." required />
              </div>
              <div class="form-group">
                <label>Theme</label>
                <select id="story-theme">
                  <option value="folklore">Folklore</option>
                  <option value="mythology">Mythology</option>
                  <option value="historical">Historical</option>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="romance">Romance</option>
                  <option value="mystery">Mystery</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="comedy">Comedy</option>
                  <option value="educational">Educational</option>
                </select>
              </div>
              <div class="form-group">
                <label>Style</label>
                <select id="story-style">
                  <option value="narrative">Narrative</option>
                  <option value="descriptive">Descriptive</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Generate Story</button>
            </form>
          </div>
        </div>

        <!-- Create Modal -->
        <div class="modal" id="create-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>✍️ Create Custom Story</h3>
            <form id="create-form">
              <div class="form-group">
                <label>Title *</label>
                <input type="text" id="story-title" required />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="story-description" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Theme</label>
                <select id="create-story-theme">
                  <option value="cultural">Cultural</option>
                  <option value="folklore">Folklore</option>
                  <option value="mythology">Mythology</option>
                  <option value="historical">Historical</option>
                </select>
              </div>
              <div class="form-group">
                <label>Introduction *</label>
                <textarea id="story-introduction" rows="3" placeholder="Once upon a time..." required></textarea>
              </div>
              <div class="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" id="story-tags" placeholder="tag1, tag2, tag3" />
              </div>
              <button type="submit" class="btn btn-primary">Create Story</button>
            </form>
          </div>
        </div>

        <!-- Story Display -->
        <div id="story-view" class="story-view">
          <div class="story-placeholder">
            <p>📚 Select a story to read or generate a new one</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button onclick="document.getElementById('btn-generate').click()" class="btn btn-primary">
                ✨ Generate
              </button>
              <button onclick="document.getElementById('btn-create').click()" class="btn btn-secondary">
                ✍️ Create
              </button>
            </div>
          </div>
        </div>

        <!-- Story List -->
        <div class="story-list-section">
          <h4>📚 Available Stories</h4>
          <div class="story-filters">
            <input type="text" id="story-search" placeholder="🔍 Search stories..." />
            <select id="theme-filter">
              <option value="">All Themes</option>
            </select>
            <button id="btn-apply-filters" class="btn btn-primary">Apply</button>
          </div>
          <div id="stories-list" class="stories-list">
            <div class="loading">Loading stories...</div>
          </div>
        </div>
      </div>
    `;
  }

  async loadStories() {
    try {
      const response = await fetch(`${this.apiBase}/api/stories`);
      const data = await response.json();

      if (data.success) {
        this.renderStories(data.stories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }

  renderStories(stories) {
    const container = document.getElementById('stories-list');
    if (!container) return;

    if (!stories || stories.length === 0) {
      container.innerHTML = '<p>No stories available yet. Generate your first story!</p>';
      return;
    }

    container.innerHTML = stories.map(story => `
      <div class="story-card" onclick="window.storyUI.loadStory('${story.id}')" style="
        background: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.3s;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0;">${story.title}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">${story.description}</p>
          </div>
          <div style="text-align: right;">
            <span style="background: #e3f2fd; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${story.theme}</span>
            <div style="font-size: 12px; color: #888; margin-top: 5px;">
              ⭐ ${story.averageRating || 0} | 👁️ ${story.totalReads || 0}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
          ${story.tags ? story.tags.map(tag => 
            `<span style="background: #f5f5f5; padding: 2px 10px; border-radius: 12px; font-size: 11px;">${tag}</span>`
          ).join('') : ''}
        </div>
      </div>
    `).join('');

    // Add hover effect
    container.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateX(5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateX(0)';
      });
    });
  }

  async loadStory(storyId) {
    try {
      const response = await fetch(`${this.apiBase}/api/story/${storyId}`);
      const data = await response.json();

      if (data.success) {
        this.currentStory = data.story;
        this.renderStory(data.story);
        this.showToast('📖 Story loaded!', 'info');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      this.showToast('❌ Error loading story', 'error');
    }
  }

  renderStory(story) {
    const container = document.getElementById('story-view');
    if (!container) return;

    const content = story.content;
    const branches = content.branches || [];

    // Find first branch
    const firstBranch = branches.length > 0 ? branches[0] : null;

    container.innerHTML = `
      <div class="story-content">
        <div class="story-header">
          <h2>${story.title}</h2>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="background: #e3f2fd; padding: 4px 12px; border-radius: 15px; font-size: 12px;">${story.theme}</span>
            <span style="color: #888; font-size: 12px;">📅 ${new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="story-body">
          <div class="story-introduction">
            <p><strong>📖 ${content.introduction}</strong></p>
          </div>
          ${firstBranch ? `
            <div class="story-branch" id="story-branch">
              <div class="branch-text">
                <p>${firstBranch.text}</p>
              </div>
              ${firstBranch.choices && firstBranch.choices.length > 0 ? `
                <div class="branch-choices">
                  <p><strong>What do you do?</strong></p>
                  ${firstBranch.choices.map(choice => `
                    <button onclick="window.storyUI.makeChoice('${story.id}', '${choice.id}')" class="choice-btn" style="
                      display: block;
                      width: 100%;
                      padding: 10px 15px;
                      margin: 5px 0;
                      background: white;
                      border: 2px solid #4CAF50;
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.3s;
                      text-align: left;
                    ">
                      ${choice.text}
                    </button>
                  `).join('')}
                </div>
              ` : `
                <div class="branch-end">
                  <p>✨ The story continues...</p>
                  <button onclick="window.storyUI.loadStories()" class="btn btn-primary">
                    📚 Explore More Stories
                  </button>
                </div>
              `}
            </div>
          ` : `
            <div class="story-conclusion">
              <p><strong>📝 ${content.conclusion || 'The end.'}</strong></p>
            </div>
          `}
        </div>
        <div class="story-actions">
          <button onclick="window.storyUI.rateStory('${story.id}')" class="btn btn-secondary">
            ⭐ Rate Story
          </button>
          <button onclick="window.storyUI.shareStory('${story.id}')" class="btn btn-info">
            📤 Share
          </button>
        </div>
      </div>
    `;
  }

  async makeChoice(storyId, choiceId) {
    try {
      const response = await fetch(`${this.apiBase}/api/story/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          choiceId,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('📖 Story continues...', 'info');
        // Reload story to show next branch
        this.loadStory(storyId);
      }
    } catch (error) {
      console.error('Error making choice:', error);
      this.showToast('❌ Error continuing story', 'error');
    }
  }

  async loadThemes() {
    try {
      const response = await fetch(`${this.apiBase}/api/stories/themes`);
      const data = await response.json();

      if (data.success) {
        const select = document.getElementById('theme-filter');
        if (select) {
          data.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            select.appendChild(option);
          });
        }

        // Also populate generate modal
        const genSelect = document.getElementById('story-theme');
        if (genSelect) {
          data.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            genSelect.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  }

  async loadAnalytics() {
    try {
      const response = await fetch(`${this.apiBase}/api/stories/analytics`);
      const data = await response.json();

      if (data.success) {
        console.log('📊 Story Analytics:', data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async generateStory(event) {
    event.preventDefault();

    const prompt = document.getElementById('story-prompt').value;
    const theme = document.getElementById('story-theme').value;
    const style = document.getElementById('story-style').value;

    if (!prompt) {
      this.showToast('❌ Please enter a prompt', 'error');
      return;
    }

    try {
      this.showToast('✨ Generating story...', 'info');
      
      const response = await fetch(`${this.apiBase}/api/story/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme, style })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Story generated successfully!', 'success');
        document.getElementById('generate-modal').style.display = 'none';
        document.getElementById('generate-form').reset();
        this.loadStories();
        this.loadStory(data.story.id);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      this.showToast('❌ Error generating story', 'error');
    }
  }

  async createCustomStory(event) {
    event.preventDefault();

    const storyData = {
      title: document.getElementById('story-title').value,
      description: document.getElementById('story-description').value,
      theme: document.getElementById('create-story-theme').value,
      content: {
        introduction: document.getElementById('story-introduction').value,
        branches: [],
        conclusion: 'The story continues...'
      },
      tags: document.getElementById('story-tags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      const response = await fetch(`${this.apiBase}/api/story/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyData,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Custom story created!', 'success');
        document.getElementById('create-modal').style.display = 'none';
        document.getElementById('create-form').reset();
        this.loadStories();
        this.loadStory(data.story.id);
      }
    } catch (error) {
      console.error('Error creating story:', error);
      this.showToast('❌ Error creating story', 'error');
    }
  }

  async rateStory(storyId) {
    const rating = prompt('Rate this story (1-5):', '4');
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) return;

    try {
      const response = await fetch(`${this.apiBase}/api/story/${storyId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: parseInt(rating) })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('⭐ Story rated!', 'success');
        this.loadStory(storyId);
      }
    } catch (error) {
      console.error('Error rating story:', error);
      this.showToast('❌ Error rating story', 'error');
    }
  }

  shareStory(storyId) {
    const url = `${window.location.origin}/story/${storyId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.showToast('📤 Story link copied!', 'success');
    } else {
      prompt('Copy this link:', url);
    }
  }

  setupEventListeners() {
    // Generate modal
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-generate' || e.target.closest('#btn-generate')) {
        document.getElementById('generate-modal').style.display = 'flex';
      }
    });

    // Create modal
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-create' || e.target.closest('#btn-create')) {
        document.getElementById('create-modal').style.display = 'flex';
      }
    });

    // Analytics
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-analytics' || e.target.closest('#btn-analytics')) {
        this.loadAnalytics();
        this.showToast('📊 Analytics loaded!', 'info');
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || 
          (e.target.closest('.modal') && !e.target.closest('.modal-content'))) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });

    // Generate form
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'generate-form') {
        e.preventDefault();
        this.generateStory(e);
      }
    });

    // Create form
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'create-form') {
        e.preventDefault();
        this.createCustomStory(e);
      }
    });

    // Search and filters
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-apply-filters' || e.target.closest('#btn-apply-filters')) {
        this.applyFilters();
      }
    });

    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'story-search' && e.key === 'Enter') {
        this.applyFilters();
      }
    });
  }

  async applyFilters() {
    const search = document.getElementById('story-search').value;
    const theme = document.getElementById('theme-filter').value;

    try {
      let url = `${this.apiBase}/api/stories?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (theme) url += `theme=${theme}&`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        this.renderStories(data.stories);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
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
  const storyUI = new StorytellingUI({
    container: '#storytelling-container'
  });
  window.storyUI = storyUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .storytelling-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .storytelling-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .storytelling-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .story-view { min-height: 300px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
  .story-placeholder { text-align: center; padding: 60px; color: #666; }
  .story-placeholder p { font-size: 20px; }
  .story-content { }
  .story-header { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
  .story-body { margin: 15px 0; }
  .story-introduction { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
  .story-branch { margin: 15px 0; }
  .branch-text { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
  .branch-choices { margin: 15px 0; }
  .choice-btn:hover { background: #f5f5f5; transform: translateX(5px); }
  .story-actions { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
  .story-list-section { margin: 20px 0; }
  .story-filters { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
  .story-filters input, .story-filters select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; min-width: 150px; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
  .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
  .loading { text-align: center; padding: 40px; color: #666; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .storytelling-header { flex-direction: column; align-items: stretch; }
    .storytelling-actions { justify-content: stretch; }
    .storytelling-actions .btn { flex: 1; }
  }
`;
document.head.appendChild(style);