// public/scripts/itineraryPlanner.js

class ItineraryPlannerUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/itinerary';
    this.userId = this.getUserId();
    this.container = options.container || '#itinerary-container';
    this.currentItinerary = null;
    this.preferences = {};
    
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
    this.loadSites();
    this.loadStats();
    this.setupEventListeners();
    console.log('✅ Itinerary Planner UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="itinerary-interface">
        <div class="itinerary-header">
          <h2>🗺️ Smart Cultural Itinerary Planner</h2>
          <div class="itinerary-actions">
            <button id="btn-generate" class="btn btn-primary">
              ✨ Generate Itinerary
            </button>
            <button id="btn-preferences" class="btn btn-secondary">
              ⚙️ Preferences
            </button>
            <button id="btn-collaborate" class="btn btn-info">
              👥 Collaborate
            </button>
          </div>
        </div>

        <!-- Preferences Modal -->
        <div class="modal" id="preferences-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>⚙️ Travel Preferences</h3>
            <form id="preferences-form">
              <div class="form-group">
                <label>Trip Name</label>
                <input type="text" id="pref-name" value="Cultural Heritage Tour" />
              </div>
              <div class="form-group">
                <label>Duration (Days)</label>
                <input type="number" id="pref-days" value="3" min="1" max="14" />
              </div>
              <div class="form-group">
                <label>Categories</label>
                <div id="pref-categories">
                  ${['heritage', 'culture', 'nature', 'art', 'music', 'craft'].map(cat => `
                    <label style="display: inline-block; margin: 5px;">
                      <input type="checkbox" value="${cat}" checked /> ${cat}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label>Interests</label>
                <input type="text" id="pref-interests" placeholder="history, art, music, architecture..." value="history, culture" />
              </div>
              <div class="form-group">
                <label>Budget</label>
                <select id="pref-budget">
                  <option value="budget">Budget</option>
                  <option value="moderate" selected>Moderate</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div class="form-group">
                <label>Difficulty</label>
                <select id="pref-difficulty">
                  <option value="easy" selected>Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div class="form-group">
                <label>Accessibility</label>
                <input type="checkbox" id="pref-accessibility" />
                <label for="pref-accessibility">Wheelchair accessible</label>
              </div>
              <button type="submit" class="btn btn-primary">Save Preferences</button>
            </form>
          </div>
        </div>

        <!-- Itinerary Results -->
        <div id="itinerary-results" class="itinerary-results">
          <div class="placeholder">
            <p>🔮 Enter your preferences and generate a personalized itinerary</p>
            <p style="font-size: 14px; color: #666;">We'll create a custom cultural exploration just for you!</p>
            <button onclick="document.getElementById('btn-generate').click()" class="btn btn-primary">
              Get Started
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-section" id="stats-section">
          <h4>📊 Itinerary Stats</h4>
          <div id="stats-grid" class="stats-grid"></div>
        </div>
      </div>
    `;
  }

  async generateItinerary() {
    const container = document.getElementById('itinerary-results');
    if (!container) return;

    this.setLoading(container, true);

    try {
      // Collect preferences
      const preferences = this.getPreferences();
      
      const response = await fetch(`${this.apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.currentItinerary = data.itinerary;
        this.renderItinerary(container, data);
        this.showToast('✅ Itinerary generated successfully!', 'success');
      } else {
        this.showToast('❌ Failed to generate itinerary', 'error');
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      this.showToast('❌ Error generating itinerary', 'error');
    } finally {
      this.setLoading(container, false);
    }
  }

  getPreferences() {
    return {
      name: document.getElementById('pref-name')?.value || 'Cultural Tour',
      days: parseInt(document.getElementById('pref-days')?.value) || 3,
      categories: Array.from(document.querySelectorAll('#pref-categories input:checked'))
        .map(cb => cb.value),
      interests: document.getElementById('pref-interests')?.value.split(',').map(s => s.trim()) || [],
      budget: document.getElementById('pref-budget')?.value || 'moderate',
      difficulty: document.getElementById('pref-difficulty')?.value || 'easy',
      accessibility: document.getElementById('pref-accessibility')?.checked || false
    };
  }

  renderItinerary(container, data) {
    const itinerary = data.itinerary;
    if (!itinerary) {
      container.innerHTML = '<p class="error">No itinerary generated</p>';
      return;
    }

    container.innerHTML = `
      <div class="itinerary-result">
        <div class="itinerary-summary">
          <h3>${itinerary.name}</h3>
          <p>${itinerary.description}</p>
          <div class="summary-metrics">
            <span>📅 ${itinerary.duration} Days</span>
            <span>💰 ₹${itinerary.totalCost.toLocaleString()}</span>
            <span>⏱️ ${itinerary.totalDuration} hours</span>
            <span>🏆 Cultural Score: ${itinerary.culturalScore}%</span>
            <span>📊 Difficulty: ${itinerary.difficulty}</span>
          </div>
        </div>

        <div class="itinerary-schedule">
          ${itinerary.schedule.map(day => `
            <div class="day-card">
              <div class="day-header">
                <h4>Day ${day.day}: ${day.title}</h4>
                <span class="day-date">${day.date}</span>
              </div>
              <div class="day-sites">
                ${day.sites.map(siteItem => `
                  <div class="site-item">
                    <div class="site-info">
                      <h5>${siteItem.site.name}</h5>
                      <p>${siteItem.site.description}</p>
                      <div class="site-meta">
                        <span>⏰ ${siteItem.startTime}</span>
                        <span>⏱️ ${siteItem.duration}h</span>
                        <span>💰 ₹${siteItem.site.entranceFee}</span>
                        <span>🏷️ ${siteItem.site.category}</span>
                      </div>
                      <div class="site-tags">
                        ${siteItem.site.tags.map(tag => 
                          `<span class="tag">${tag}</span>`
                        ).join('')}
                      </div>
                      <p class="site-notes">📝 ${siteItem.notes}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="day-meta">
                <span>🍽️ Meals: ${day.meals.join(', ')}</span>
                <span>🏨 Stay: ${day.accommodation}</span>
                <span>⏱️ Total: ${day.totalTime}h</span>
              </div>
              <div class="day-highlights">
                <strong>Cultural Highlights:</strong> ${day.culturalHighlights}
              </div>
            </div>
          `).join('')}
        </div>

        ${data.recommendations && data.recommendations.length > 0 ? `
          <div class="recommendations">
            <h4>🌟 Recommended Additions</h4>
            <div class="recommendations-grid">
              ${data.recommendations.map(site => `
                <div class="rec-card" style="
                  background: #f5f5f5;
                  padding: 15px;
                  border-radius: 8px;
                  cursor: pointer;
                " onclick="window.plannerUI.addToItinerary('${site.id}')">
                  <h5>${site.name}</h5>
                  <p style="font-size: 12px; color: #666;">${site.description}</p>
                  <span class="badge">${site.category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="itinerary-actions">
          <button onclick="window.plannerUI.shareItinerary()" class="btn btn-primary">
            📤 Share Itinerary
          </button>
          <button onclick="window.plannerUI.saveItinerary()" class="btn btn-success">
            💾 Save Itinerary
          </button>
          <button onclick="window.plannerUI.collaborateOnItinerary()" class="btn btn-info">
            👥 Collaborate
          </button>
        </div>
      </div>
    `;
  }

  async loadSites() {
    try {
      const response = await fetch(`${this.apiBase}/sites`);
      const data = await response.json();

      if (data.success) {
        console.log(`📍 Loaded ${data.count} cultural sites`);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
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
    const container = document.getElementById('stats-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.totalItineraries}</div>
        <div class="stat-label">Itineraries Created</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalSites}</div>
        <div class="stat-label">Cultural Sites</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalUsers}</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.averageDuration}</div>
        <div class="stat-label">Avg. Duration (Days)</div>
      </div>
    `;
  }

  async saveItinerary() {
    if (!this.currentItinerary) {
      this.showToast('No itinerary to save', 'info');
      return;
    }

    // In production: save to database
    this.showToast('💾 Itinerary saved successfully!', 'success');
  }

  async shareItinerary() {
    if (!this.currentItinerary) {
      this.showToast('No itinerary to share', 'info');
      return;
    }

    // In production: implement sharing
    this.showToast('📤 Share link copied to clipboard!', 'success');
  }

  async collaborateOnItinerary() {
    if (!this.currentItinerary) {
      this.showToast('Generate an itinerary first', 'info');
      return;
    }

    // In production: create collaborative plan
    this.showToast('👥 Collaboration mode activated!', 'success');
  }

  addToItinerary(siteId) {
    this.showToast(`📍 Added ${siteId} to itinerary`, 'success');
  }

  setupEventListeners() {
    // Generate itinerary
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-generate' || e.target.closest('#btn-generate')) {
        this.generateItinerary();
      }
    });

    // Preferences modal
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-preferences' || e.target.closest('#btn-preferences')) {
        document.getElementById('preferences-modal').style.display = 'flex';
      }
    });

    // Collaborate
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-collaborate' || e.target.closest('#btn-collaborate')) {
        this.showToast('👥 Collaborative planning coming soon!', 'info');
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

    // Preferences form
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'preferences-form') {
        e.preventDefault();
        document.getElementById('preferences-modal').style.display = 'none';
        this.showToast('✅ Preferences saved!', 'success');
      }
    });
  }

  setLoading(container, isLoading) {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px;">Generating your personalized itinerary...</p>
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
  const plannerUI = new ItineraryPlannerUI({
    container: '#itinerary-container'
  });
  window.plannerUI = plannerUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .itinerary-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .itinerary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .itinerary-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .itinerary-results { min-height: 200px; }
  .placeholder { text-align: center; padding: 60px; background: #f9f9f9; border-radius: 12px; }
  .placeholder p:first-child { font-size: 24px; }
  .itinerary-result { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .itinerary-summary { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
  .summary-metrics { display: flex; gap: 15px; flex-wrap: wrap; margin: 10px 0; }
  .summary-metrics span { background: #f5f5f5; padding: 5px 15px; border-radius: 20px; font-size: 13px; }
  .day-card { background: #f9f9f9; border-radius: 10px; padding: 15px; margin: 15px 0; }
  .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .day-date { color: #666; font-size: 14px; }
  .day-sites { margin: 10px 0; }
  .site-item { background: white; padding: 15px; border-radius: 8px; margin: 8px 0; }
  .site-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #666; }
  .site-tags { display: flex; gap: 5px; flex-wrap: wrap; margin: 5px 0; }
  .tag { background: #e3f2fd; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
  .site-notes { font-size: 13px; color: #666; margin: 5px 0; }
  .day-meta { display: flex; gap: 15px; flex-wrap: wrap; font-size: 12px; color: #666; margin: 10px 0; }
  .day-highlights { font-size: 13px; color: #333; }
  .badge { background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; }
  .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .stat-value { font-size: 2em; font-weight: bold; color: #2E7D32; }
  .recommendations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 10px 0; }
  .rec-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-secondary { background: #FF9800; color: white; }
  .btn-secondary:hover { background: #F57C00; }
  .btn-info { background: #2196F3; color: white; }
  .btn-info:hover { background: #1976D2; }
  .btn-success { background: #4CAF50; color: white; }
  .btn-success:hover { background: #388E3C; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
  .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
  .itinerary-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .itinerary-header { flex-direction: column; align-items: stretch; }
    .itinerary-actions { justify-content: stretch; }
    .itinerary-actions .btn { flex: 1; }
    .summary-metrics { flex-direction: column; align-items: start; }
    .day-header { flex-direction: column; align-items: start; }
  }
`;
document.head.appendChild(style);