/* Crop agronomic profiles used by the offline recommendation engine.
   Ranges represent healthy growing conditions for the 7 README parameters.
   Source: standard crop recommendation agronomy (Kaggle Crop Recommendation dataset ranges). */
window.CROP_DATA = [
  {
    name: "Rice", emoji: "🌾", color: "#4ba85b", season: "Kharif (Monsoon)",
    range: { n: [60, 140], p: [30, 70], k: [30, 80], ph: [5.5, 7.2], temp: [22, 34], humidity: [65, 92], rainfall: [150, 320] },
    tip: "Keep fields flooded 2–5 cm deep during vegetative growth; drain before harvest."
  },
  {
    name: "Wheat", emoji: "🌾", color: "#c9a227", season: "Rabi (Winter)",
    range: { n: [70, 150], p: [40, 90], k: [30, 70], ph: [6.0, 7.5], temp: [15, 27], humidity: [45, 75], rainfall: [50, 130] },
    tip: "Sow when soil temperature is cool; avoid excess nitrogen to prevent lodging."
  },
  {
    name: "Maize", emoji: "🌽", color: "#e0a526", season: "Kharif / Rabi",
    range: { n: [70, 150], p: [35, 80], k: [25, 70], ph: [5.8, 7.5], temp: [21, 32], humidity: [50, 82], rainfall: [60, 160] },
    tip: "Ensure good drainage; maize is sensitive to waterlogging in the first 3 weeks."
  },
  {
    name: "Cotton", emoji: "🧵", color: "#8fae7e", season: "Kharif",
    range: { n: [50, 130], p: [30, 80], k: [20, 70], ph: [6.0, 8.0], temp: [24, 36], humidity: [45, 80], rainfall: [50, 150] },
    tip: "Requires a long frost-free season and deep, well-drained black cotton soil."
  },
  {
    name: "Jute", emoji: "🌿", color: "#6d9a3e", season: "Kharif",
    range: { n: [60, 150], p: [25, 70], k: [35, 90], ph: [6.0, 7.5], temp: [24, 35], humidity: [70, 95], rainfall: [150, 350] },
    tip: "Thrive in hot, humid conditions with plenty of rainfall and fertile alluvial soil."
  },
  {
    name: "Coconut", emoji: "🥥", color: "#7a5b3a", season: "Perennial (Year-round)",
    range: { n: [40, 120], p: [20, 60], k: [40, 110], ph: [5.5, 8.0], temp: [24, 34], humidity: [65, 92], rainfall: [130, 350] },
    tip: "Needs sandy loam soil, high humidity and regular rainfall with good drainage."
  },
  {
    name: "Banana", emoji: "🍌", color: "#e3c132", season: "Perennial (Year-round)",
    range: { n: [70, 170], p: [35, 90], k: [60, 150], ph: [5.5, 7.5], temp: [24, 35], humidity: [60, 90], rainfall: [120, 300] },
    tip: "Heavy feeder — apply potash regularly and protect plants from strong winds."
  },
  {
    name: "Mango", emoji: "🥭", color: "#e08a1e", season: "Perennial (Summer fruit)",
    range: { n: [40, 110], p: [20, 60], k: [35, 100], ph: [5.5, 7.5], temp: [22, 36], humidity: [40, 80], rainfall: [60, 200] },
    tip: "Avoid waterlogging; a dry spell before flowering improves fruit set."
  },
  {
    name: "Papaya", emoji: "🍈", color: "#d98b3a", season: "Year-round (tropical)",
    range: { n: [60, 150], p: [40, 100], k: [50, 120], ph: [6.0, 7.0], temp: [23, 34], humidity: [60, 90], rainfall: [100, 250] },
    tip: "Needs frost-free conditions, full sun and well-drained fertile soil."
  },
  {
    name: "Orange", emoji: "🍊", color: "#ef8b25", season: "Winter fruit",
    range: { n: [50, 130], p: [25, 70], k: [40, 110], ph: [6.0, 7.5], temp: [18, 32], humidity: [45, 80], rainfall: [70, 200] },
    tip: "Citrus prefers slightly acidic soil; correct iron deficiency with chelates."
  },
  {
    name: "Apple", emoji: "🍎", color: "#d8453f", season: "Temperate (Autumn)",
    range: { n: [40, 110], p: [25, 70], k: [40, 100], ph: [5.8, 7.0], temp: [10, 24], humidity: [45, 80], rainfall: [80, 200] },
    tip: "Needs winter chilling hours and well-drained loamy soil; protect from hail."
  },
  {
    name: "Grapes", emoji: "🍇", color: "#7d4a9c", season: "Summer fruit",
    range: { n: [40, 110], p: [25, 70], k: [40, 110], ph: [6.0, 7.5], temp: [20, 34], humidity: [40, 75], rainfall: [50, 150] },
    tip: "Requires a dry harvest period; train vines on a trellis for airflow."
  },
  {
    name: "Coffee", emoji: "☕", color: "#6f4e37", season: "Perennial (tropical)",
    range: { n: [50, 130], p: [25, 70], k: [40, 110], ph: [5.5, 6.8], temp: [18, 28], humidity: [60, 90], rainfall: [150, 350] },
    tip: "Grows best under partial shade with acidic, organic-rich soil."
  },
  {
    name: "Tomato", emoji: "🍅", color: "#e2453c", season: "Year-round / Rabi",
    range: { n: [70, 160], p: [40, 100], k: [50, 130], ph: [6.0, 7.0], temp: [20, 30], humidity: [50, 80], rainfall: [60, 160] },
    tip: "Stake plants, avoid overhead watering and maintain steady moisture to prevent cracking."
  },
  {
    name: "Potato", emoji: "🥔", color: "#a98252", season: "Rabi / Winter",
    range: { n: [60, 150], p: [40, 100], k: [80, 180], ph: [5.5, 6.8], temp: [15, 25], humidity: [55, 85], rainfall: [60, 150] },
    tip: "Potassium is critical for tuber bulking; hill soil around plants as they grow."
  },
  {
    name: "Onion", emoji: "🧅", color: "#b07a8e", season: "Rabi / Kharif",
    range: { n: [60, 140], p: [30, 80], k: [40, 110], ph: [6.0, 7.5], temp: [15, 30], humidity: [45, 80], rainfall: [50, 130] },
    tip: "Shallow roots need frequent light irrigation; avoid deep cultivation."
  },
  {
    name: "Sugarcane", emoji: "🎋", color: "#7fa33e", season: "Perennial (12–18 months)",
    range: { n: [90, 200], p: [40, 100], k: [50, 130], ph: [6.0, 7.5], temp: [24, 36], humidity: [60, 90], rainfall: [150, 350] },
    tip: "A heavy feeder and high water requirement; earthing-up prevents lodging."
  },
  {
    name: "Groundnut", emoji: "🥜", color: "#bf8c4a", season: "Kharif / Rabi",
    range: { n: [40, 100], p: [40, 90], k: [30, 80], ph: [6.0, 7.5], temp: [22, 32], humidity: [45, 80], rainfall: [50, 140] },
    tip: "Needs loose, sandy soil for peg penetration; inoculate with Rhizobium."
  },
  {
    name: "Chickpea", emoji: "🫘", color: "#88703b", season: "Rabi (Winter)",
    range: { n: [30, 90], p: [40, 100], k: [30, 80], ph: [6.5, 8.0], temp: [15, 28], humidity: [35, 70], rainfall: [40, 110] },
    tip: "Drought-tolerant pulse; avoid excess nitrogen which delays maturity."
  },
  {
    name: "Lentil", emoji: "🌱", color: "#9b7b3f", season: "Rabi (Winter)",
    range: { n: [30, 80], p: [35, 90], k: [30, 80], ph: [6.5, 8.0], temp: [12, 26], humidity: [35, 70], rainfall: [40, 110] },
    tip: "Sow on well-drained loam; sensitive to waterlogging and high humidity."
  },
  {
    name: "Mung Bean", emoji: "🌿", color: "#7ea43f", season: "Kharif / Summer",
    range: { n: [30, 80], p: [35, 90], k: [30, 80], ph: [6.2, 7.8], temp: [24, 34], humidity: [40, 80], rainfall: [50, 140] },
    tip: "Short-duration crop; harvest pods promptly to avoid shattering."
  },
  {
    name: "Black Gram", emoji: "🌱", color: "#6b5433", season: "Kharif",
    range: { n: [30, 90], p: [35, 90], k: [30, 80], ph: [6.0, 7.8], temp: [24, 35], humidity: [45, 85], rainfall: [60, 160] },
    tip: "Warm-season pulse; ensure good drainage and control weeds early."
  }
];

window.CROP_PRESETS = {
  rice:     { n: 90,  p: 45, k: 50, ph: 6.5, temp: 28, humidity: 82, rainfall: 220 },
  wheat:    { n: 110, p: 60, k: 45, ph: 7.0, temp: 21, humidity: 60, rainfall: 90  },
  tomato:   { n: 120, p: 70, k: 90, ph: 6.5, temp: 26, humidity: 68, rainfall: 110 },
  sugarcane:{ n: 150, p: 65, k: 95, ph: 7.0, temp: 30, humidity: 75, rainfall: 240 }
};
