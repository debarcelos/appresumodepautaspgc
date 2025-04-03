import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = 'https://portal.tce.go.gov.br/documents/129288/206893/Logo+MPC-GO/5088e3d6-1681-4376-80b3-2d94d7c15d3a?t=1571833665000';
const filePath = join(__dirname, 'src', 'assets', 'logo-mpc.png');

try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const buffer = await response.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));
  console.log('Download concluído!');
} catch (error) {
  console.error('Erro ao baixar a imagem:', error.message);
}
