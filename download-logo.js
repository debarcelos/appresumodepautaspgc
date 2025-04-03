const https = require('https');
const fs = require('fs');

const url = 'https://portal.tce.go.gov.br/documents/129288/206893/Logo+MPC-GO/5088e3d6-1681-4376-80b3-2d94d7c15d3a?t=1571833665000';
const filePath = './src/assets/logo-mpc.png';

https.get(url, (res) => {
  const fileStream = fs.createWriteStream(filePath);
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Download concluído!');
  });
}).on('error', (err) => {
  console.error('Erro ao baixar a imagem:', err.message);
});
