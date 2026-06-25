const store = require('../data/store');

const getPaths = (req, res) => {
  const { theme, sortBy, order } = req.query;
  let paths = [...store.heritagePaths];

  // Apply Theme Filter
  if (theme && theme.trim() !== '') {
    paths = paths.filter(
      (p) => p.theme && p.theme.toLowerCase().includes(theme.trim().toLowerCase())
    );
  }

  // Apply Sorting
  if (sortBy === 'itemCount') {
    paths.sort((a, b) => {
      const aCount = Array.isArray(a.items) ? a.items.length : 0;
      const bCount = Array.isArray(b.items) ? b.items.length : 0;
      return order === 'desc' ? bCount - aCount : aCount - bCount;
    });
  }

  res.json(paths);
};

const createPath = (req, res) => {
  try {
    if (!req.body.title || !req.body.theme) {
      return res.status(400).json({
        error: 'Missing required fields: title, theme',
      });
    }

    const newPath = {
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description || '',
      items: Array.isArray(req.body.items) ? req.body.items : [],
      theme: req.body.theme,
    };

    store.heritagePaths.push(newPath);

    res.json(newPath);
  } catch (error) {
    res.status(500).json({
      error: 'Error creating path',
    });
  }
};

module.exports = {
  getPaths,
  createPath,
};
