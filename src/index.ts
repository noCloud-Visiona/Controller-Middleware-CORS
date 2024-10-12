import express, { Request, Response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // Certifique-se de estar usando a versão 2.x do node-fetch

const app = express();
const PORT = 3003;

// Middleware para habilitar CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

// Rota para buscar dados de uma API externa usando fetch
app.post('/fetch-data', async (req: Request, res: Response) => {
  const { startDate, endDate, startPoint, endPoint } = req.body;

  const startDateString = new Date(startDate).toISOString().split('T')[0];
  const endDateString = new Date(endDate).toISOString().split('T')[0];
  const bbox = `${startPoint.longitude},${startPoint.latitude},${endPoint.longitude},${endPoint.latitude}`;
  const url = `https://data.inpe.br/bdc/stac/v1/search?collections=CB4A-WPM-PCA-FUSED-1&datetime=${startDateString}/${endDateString}&bbox=${bbox}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na solicitação: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da API externa' });
  }
});

// Rota para buscar a imagem e evitar problemas de CORS
app.get('/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    return res.status(400).json({ error: 'URL da imagem não fornecida' });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Erro ao buscar a imagem: ${response.status}`);
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return res.send(buffer);
  } catch (error) {
    console.error('Erro ao buscar a imagem:', error);
    return res.status(500).json({ error: 'Erro ao buscar a imagem' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});