import fs from 'fs';
fetch('https://docs.google.com/spreadsheets/d/1vERLh_6ywf_buGaMpxdCkF2ES94W9M_a6hLNxobRsuo/export?format=csv')
  .then(r => r.text())
  .then(t => {
    const lines = t.split('\n');
    const commodities = lines.map(l => l.split(',')[0]);
    console.log(commodities.join('\n'));
  });
