// import dotenv from "dotenv";
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();

const itemRoutes = require('./routes/item.routes');
const pathRoutes = require('./routes/path.routes');
const progressRoutes = require('./routes/progress.routes');
const postRoutes = require('./routes/post.routes');
const chatRoutes = require('./routes/chat.routes');
const checkinRoutes = require('./routes/checkin.routes');
const languageRoutes = require('./routes/language.routes');
const recipeRoutes = require('./routes/recipe.routes');
const natureRoutes = require('./routes/nature.routes');

const initializeSampleLanguageData = require('./config/sampleLanguageData');
const initializeSampleNatureData = require('./config/sampleNatureData');


const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const initializeSampleData = require('./config/sampleData');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://unpkg.com',
          'https://api.maptiler.com',
          'https://*.tile.openstreetmap.org',
          'https://cdn.sanity.io',
          'https://encrypted-tbn0.gstatic.com',
          'https://cdn.shopify.com',
        ],
        connectSrc: ["'self'", 'https://api.maptiler.com'],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// Initialize Data
initializeSampleData();
initializeSampleLanguageData();
const initializeSampleRecipeData = require('./config/sampleRecipeData');
initializeSampleRecipeData();
initializeSampleNatureData();

// API Routes (existing)
app.use('/api/items', itemRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/nature', natureRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/api/language/config', (req, res) => {
  res.json({
    default: 'en',
    supported: ['en', 'hi', 'mr'],
  });
});
app.get('/api/map-style', async (req, res) => {
  if (!process.env.MAPTILER_KEY) {
    // Fall back to keyless OpenStreetMap raster tiles
    return res.json({
      version: 8,
      sources: {
        'osm-raster-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    });
  }

  try {
    const response = await fetch(
      `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_KEY}`
    );

    if (!response.ok) {
      return res.status(502).json({
        configured: false,
        message:
          'Unable to load map tiles. Please verify your MAPTILER_KEY is valid.',
      });
    }

    const style = await response.json();
    res.json(style);
  } catch (error) {
    res.status(502).json({
      configured: false,
      message: 'Unable to load map tiles. Please try again later.',
    });
  }
});

// 404 Middleware
app.use(notFound);

// Error Middleware
app.use(errorHandler);

//map key

//custom 404 route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, './public', '404.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ Parampara server running on http://localhost:${PORT}`);
});
