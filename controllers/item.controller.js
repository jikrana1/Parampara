/**
 * Parampara - Cultural Item Controller
 * Handles retrieval, full-text searching, filtering, pagination, 
 * and insertion of rural cultural heritage assets.
 */

const store = require('../data/store');

/**
 * Retrieves a list of cultural items with optional search, category filters, and pagination.
 * 
 * @param {Object} req Express request object containing query parameters.
 * @param {Object} res Express response object.
 */
const getItems = (req, res) => {
  try {
    let culturalAssets = store.culturalItems || [];

    // Extract and parse pagination config & query variables
    const activePage = parseInt(req.query.page, 10) || 1;
    const itemsPerPageLimit = parseInt(req.query.limit, 10) || 10;
    const categoryTypeFilter = req.query.type;
    const fullTextSearchQuery = req.query.search;

    // Utilize the TF-IDF indexing search engine for full-text queries
    if (fullTextSearchQuery) {
      culturalAssets = store.searchEngine.search(fullTextSearchQuery, 'culturalItem');
    }

    // Filter items based on specified type category (skip if set to 'all')
    if (categoryTypeFilter && categoryTypeFilter !== 'all') {
      culturalAssets = culturalAssets.filter(asset => asset.type === categoryTypeFilter);
    }

    // Calculate metadata limits for pagination offset boundaries
    const totalMatchedItems = culturalAssets.length;
    const totalPagesCount = Math.ceil(totalMatchedItems / itemsPerPageLimit);
    const paginationOffset = (activePage - 1) * itemsPerPageLimit;
    const paginationUpperLimit = paginationOffset + itemsPerPageLimit;
    
    // Slice active assets block for client response
    const pagedCulturalItems = culturalAssets.slice(paginationOffset, paginationUpperLimit);

    // Send formatted pagination response
    res.json({
      data: pagedCulturalItems,
      meta: {
        currentPage: activePage,
        limit: itemsPerPageLimit,
        totalItems: totalMatchedItems,
        totalPages: totalPagesCount
      }
    });
  } catch (fetchError) {
    console.error('[Item Controller] Failed to fetch cultural items:', fetchError);
    res.status(500).json({ error: 'Error fetching items' });
  }
};

/**
 * Creates and stores a new cultural item in the registry.
 * 
 * @param {Object} req Express request object containing item payload in body.
 * @param {Object} res Express response object.
 */
const createItem = (req, res) => {
  try {
    const { title, type, location } = req.body;

    // Enforce presence of essential fields
    if (!title || !type || !location) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, location',
      });
    }

    // Build the structured item object
    const createdAsset = {
      id: Date.now().toString(),
      title: title,
      type: type,
      location: location,
      coordinates: req.body.coordinates || null,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl || '',
      audioUrl: req.body.audioUrl || '',
      tags: Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags
          ? [req.body.tags]
          : [],
      timestamp: new Date().toISOString(),
    };

    // Store in memory database
    store.culturalItems.push(createdAsset);

    // Return the newly created asset
    res.status(201).json(createdAsset);
  } catch (insertionError) {
    console.error('[Item Controller] Failed to create item:', insertionError);
    res.status(500).json({
      error: 'Error adding item',
    });
  }
};

module.exports = {
  getItems,
  createItem,
};
