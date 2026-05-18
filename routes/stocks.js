const express = require('express');
const router = express.Router();
const https = require('https');
const cheerio = require('cheerio');

const WANTED = ['ENGRO', 'LUCK', 'PSO', 'HBL', 'UBL', 'MCB', 'OGDC', 'PPL', 'NESTLE', 'SEARL'];

const NAMES = {
  ENGRO: 'Engro Corporation',
  LUCK: 'Lucky Cement',
  PSO: 'Pakistan State Oil',
  HBL: 'Habib Bank',
  UBL: 'United Bank',
  MCB: 'MCB Bank',
  OGDC: 'Oil & Gas Dev. Co.',
  PPL: 'Pakistan Petroleum',
  NESTLE: 'Nestle Pakistan',
  SEARL: 'The Searle Company',
};

function fetchMarketWatch() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dps.psx.com.pk',
      path: '/market-watch',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://dps.psx.com.pk/',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.end();
  });
}

router.get('/', async (req, res) => {
  try {
    const html = await fetchMarketWatch();
    const $ = cheerio.load(html);
    const results = [];

    // Parse each row in the market watch table
    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 6) return;

      const symbol = $(cells[0]).text().trim().toUpperCase();
      if (!WANTED.includes(symbol)) return;

      const ldcp   = parseFloat($(cells[1]).text().trim().replace(/,/g, '')) || 0; // previous close
      const open   = parseFloat($(cells[2]).text().trim().replace(/,/g, '')) || 0;
      const high   = parseFloat($(cells[3]).text().trim().replace(/,/g, '')) || 0;
      const low    = parseFloat($(cells[4]).text().trim().replace(/,/g, '')) || 0;
      const current = parseFloat($(cells[5]).text().trim().replace(/,/g, '')) || 0;
      const volume = $(cells[6]) ? $(cells[6]).text().trim().replace(/,/g, '') : 'N/A';

      const change = ldcp > 0 ? (current - ldcp).toFixed(2) : 'N/A';
      const changePct = ldcp > 0 ? (((current - ldcp) / ldcp) * 100).toFixed(2) : 'N/A';

      results.push({
        symbol,
        name: NAMES[symbol] || symbol,
        price: current || 'N/A',
        change,
        changePercent: changePct,
        high: high || 'N/A',
        low: low || 'N/A',
        volume: volume || 'N/A',
      });
    });

    if (results.length === 0) {
      return res.status(500).json({ error: 'No matching stocks found in table' });
    }

    res.json(results);
  } catch (err) {
    console.error('Stock fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock data', detail: err.message });
  }
});

module.exports = router;