const fs = require('fs');

const json = require('./apartments.json');

const apartments = json.DATA.map(item => ({
  name: item.apt_nm,
  lat: Number(item.ycrd),
  lng: Number(item.xcrd),
  address: item.apt_rdn_addr
}));

const output = `export const apartments = ${JSON.stringify(apartments, null, 2)};\n`;

fs.writeFileSync('apartments.js', output, 'utf8');
console.log('apartments.js 파일이 생성되었습니다.');