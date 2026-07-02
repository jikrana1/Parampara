/**
 * Skeleton Screen UI Engine
 * Dynamically generates animated placeholder layouts while application data is being loaded.
 */
class SkeletonEngine {
  constructor() {
    this.templates = {
      card: this.createCardSkeleton.bind(this),
      list: this.createListSkeleton.bind(this)
    };
  }

  /**
   * Displays skeletons inside a given container
   * @param {HTMLElement} container - The DOM element to append skeletons to
   * @param {string} type - 'card' or 'list'
   * @param {number} count - Number of skeletons to render
   * @param {boolean} append - If true, appends instead of overwriting container content
   */
  show(container, type = 'card', count = 1, append = false) {
    if (!container) return;
    
    let html = '';
    const generator = this.templates[type] || this.templates.card;
    
    for (let i = 0; i < count; i++) {
      html += generator();
    }
    
    // Wrap in a specific class for easy identification and removal later if needed
    const wrapper = document.createElement('div');
    wrapper.className = 'skeleton-container skeleton-active';
    wrapper.innerHTML = html;

    if (append) {
      container.appendChild(wrapper);
    } else {
      container.innerHTML = '';
      container.appendChild(wrapper);
    }
  }

  /**
   * Hide and remove all skeletons from a container
   * @param {HTMLElement} container - The DOM element containing skeletons
   */
  hide(container) {
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton-active, .skeleton-card, .skeleton-list-item');
    skeletons.forEach(el => el.remove());
  }

  /**
   * Generate HTML for a card skeleton (e.g. Gallery items)
   */
  createCardSkeleton() {
    return `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-card-img"></div>
        <div class="skeleton-card-body">
          <div class="skeleton skeleton-text badge"></div>
          <div class="skeleton skeleton-text short" style="margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton-text tags">
            <div class="skeleton skeleton-tag"></div>
            <div class="skeleton skeleton-tag"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for a list skeleton (e.g. Paths, Timeline events)
   */
  createListSkeleton() {
    return `
      <div class="skeleton-list-item" aria-hidden="true">
        <div class="skeleton skeleton-list-img"></div>
        <div class="skeleton-list-content">
          <div class="skeleton skeleton-text title" style="margin-bottom:0;"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    `;
  }
}

// Export as a global singleton to be used across the app
window.SkeletonEngine = new SkeletonEngine();
