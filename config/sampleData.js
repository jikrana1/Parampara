const store = require('../data/store');

function initializeSampleData() {
  store.culturalItems.push({
    id: '1',
    title: 'Kantha Embroidery Patterns',
    type: 'visual',
    location: 'Kantha Village, Bengal',
    coordinates: [22.5726, 88.3639],
    description:
      'Traditional Kantha embroidery using running stitch on layered vintage saris.',
    tags: ['embroidery', 'textile'],
    timestamp: new Date().toISOString(),
    artisans: 12,
    records: 15,
    lastUpdated: '2026-05-15',
    engagement: 85,
  });

  store.culturalItems.push({
    id: '2',
    title: 'Dokra Metal Craft',
    type: 'visual',
    location: 'Dokra Village, Chhattisgarh',
    coordinates: [21.2787, 81.8661],
    description:
      'Ancient non-ferrous metal casting using the lost-wax method, practiced for over 4,000 years.',
    tags: ['metalwork', 'craft'],
    timestamp: new Date().toISOString(),
    artisans: 3,
    records: 5,
    lastUpdated: '2024-01-10',
    engagement: 40,
  });

  store.culturalItems.push({
    id: '3',
    title: 'Madhubani Paintings',
    type: 'visual',
    location: 'Madhubani Village, Bihar',
    coordinates: [26.3537, 86.0719],
    description:
      'Intricate paintings displaying mythological themes and nature scenes, made with fingers, twigs, and natural dyes.',
    tags: ['painting', 'art'],
    timestamp: new Date().toISOString(),
    artisans: 25,
    records: 30,
    lastUpdated: '2026-06-01',
    engagement: 90,
  });

  store.culturalItems.push({
    id: '4',
    title: 'Sikki Grass Craft',
    type: 'visual',
    location: 'Mithila Region, Bihar',
    coordinates: [26.12, 85.9],
    description:
      'Weaving of wild golden Sikki grass into baskets, toys, and boxes, a traditional craft under-threat.',
    tags: ['weaving', 'grasscraft'],
    timestamp: new Date().toISOString(),
    artisans: 4,
    records: 2,
    lastUpdated: '2025-02-14',
    engagement: 55,
  });

  store.culturalItems.push({
    id: '5',
    title: 'Kathputli Puppetry',
    type: 'story',
    location: 'Jodhpur, Rajasthan',
    coordinates: [26.2389, 73.0243],
    description:
      'Traditional string puppetry and narrative storytelling, requiring specialized woodwork and performance skills.',
    tags: ['puppetry', 'performance'],
    timestamp: new Date().toISOString(),
    artisans: 2,
    records: 1,
    lastUpdated: '2024-11-20',
    engagement: 20,
  });

  store.heritagePaths.push({
    id: 'path-1',
    title: 'The Journey of Kantha Stitch',
    theme: 'Embroidery Traditions',
  });
}

module.exports = initializeSampleData;
