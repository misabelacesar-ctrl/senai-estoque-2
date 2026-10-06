import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { InventoryDatabase, StockMovement } from './src/types/inventory';
import { getSampleSenaiData } from './src/utils/codeGenerator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'inventory-database.json');

const INITIAL_EMPTY_DB: InventoryDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  types: [],
  groups: [],
  subgroups: [],
  articles: [],
  movements: [],
  locations: [],
  githubConfig: {
    enabled: false,
    token: '',
    mode: 'gist',
    gistId: '',
    repoOwner: '',
    repoName: 'senai-estoque-backup',
    filePath: 'senai_estoque_data.json',
    autoSync: false,
    lastStatus: 'idle',
    lastMessage: 'Aguardando configuração de persistência em nuvem',
  },
};

function ensureDbFile(): InventoryDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_EMPTY_DB, null, 2), 'utf-8');
    return INITIAL_EMPTY_DB;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading database file, recreating fresh empty DB:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_EMPTY_DB, null, 2), 'utf-8');
    return INITIAL_EMPTY_DB;
  }
}

function writeDbFile(data: InventoryDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- API Endpoints ---
  app.get('/api/inventory', (req: Request, res: Response) => {
    try {
      const db = ensureDbFile();
      res.json(db);
    } catch (error: any) {
      res.status(500).json({ error: 'Falha ao ler dados de estoque', details: error.message });
    }
  });

  app.post('/api/inventory/save', (req: Request, res: Response) => {
    try {
      const newDb = req.body as InventoryDatabase;
      if (!newDb || !Array.isArray(newDb.articles) || !Array.isArray(newDb.types)) {
        return res.status(400).json({ error: 'Estrutura de banco de dados inválida' });
      }
      writeDbFile(newDb);
      res.json({ success: true, lastUpdated: newDb.lastUpdated });
    } catch (error: any) {
      res.status(500).json({ error: 'Falha ao salvar dados de estoque', details: error.message });
    }
  });

  app.post('/api/inventory/reset', (req: Request, res: Response) => {
    try {
      const resetDb: InventoryDatabase = {
        ...INITIAL_EMPTY_DB,
        lastUpdated: new Date().toISOString(),
      };
      writeDbFile(resetDb);
      res.json({ success: true, message: 'Banco de dados zerado com sucesso', db: resetDb });
    } catch (error: any) {
      res.status(500).json({ error: 'Falha ao zerar banco de dados', details: error.message });
    }
  });

  app.post('/api/inventory/seed', (req: Request, res: Response) => {
    try {
      const seedDb = getSampleSenaiData();
      writeDbFile(seedDb);
      res.json({ success: true, message: 'Dados de demonstração do SENAI-SP carregados com sucesso', db: seedDb });
    } catch (error: any) {
      res.status(500).json({ error: 'Falha ao carregar semente de demonstração', details: error.message });
    }
  });

  // Atomic stock movement
  app.post('/api/inventory/movement', (req: Request, res: Response) => {
    try {
      const { articleId, type, quantity, documentNumber, originDestination, reason, operator, unitCost, notes } = req.body;

      if (!articleId || !type || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Parâmetros de movimentação inválidos ou quantidade menor/igual a zero' });
      }

      const db = ensureDbFile();
      const articleIndex = db.articles.findIndex(a => a.id === articleId);

      if (articleIndex === -1) {
        return res.status(404).json({ error: 'Artigo não encontrado no catálogo' });
      }

      const article = db.articles[articleIndex];
      const previousStock = Number(article.currentStock) || 0;
      let newStock = previousStock;

      if (type === 'ENTRADA') {
        newStock = previousStock + Number(quantity);
      } else if (type === 'SAIDA') {
        if (previousStock < Number(quantity)) {
          return res.status(400).json({
            error: `Saldo insuficiente! Saldo atual: ${previousStock} ${article.unit}. Tentativa de saída: ${quantity} ${article.unit}.`,
          });
        }
        newStock = previousStock - Number(quantity);
      } else if (type === 'AJUSTE') {
        newStock = Number(quantity);
      }

      const movementRecord: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        articleId,
        type,
        quantity: Number(quantity),
        previousStock,
        newStock,
        date: new Date().toISOString(),
        documentNumber: documentNumber ? String(documentNumber).trim() : undefined,
        originDestination: String(originDestination || 'Não informado').trim(),
        reason: String(reason || (type === 'ENTRADA' ? 'Entrada regular' : 'Baixa de estoque')).trim(),
        operator: String(operator || 'Almoxarifado SENAI').trim(),
        unitCost: unitCost ? Number(unitCost) : undefined,
        notes: notes ? String(notes).trim() : undefined,
      };

      // Atualiza o artigo
      db.articles[articleIndex] = {
        ...article,
        currentStock: newStock,
        updatedAt: new Date().toISOString(),
        averageUnitCost: unitCost && type === 'ENTRADA' ? Number(unitCost) : article.averageUnitCost,
      };

      db.movements.unshift(movementRecord);
      writeDbFile(db);

      res.json({
        success: true,
        movement: movementRecord,
        updatedArticle: db.articles[articleIndex],
        db,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Falha ao processar movimentação', details: error.message });
    }
  });

  // GitHub Sync integration
  app.post('/api/inventory/github-sync', async (req: Request, res: Response) => {
    try {
      const { token, mode, gistId, repoOwner, repoName, filePath } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token do GitHub não fornecido' });
      }

      const db = ensureDbFile();
      const contentStr = JSON.stringify(db, null, 2);

      if (mode === 'gist' || !mode) {
        // Gist storage
        if (gistId) {
          // Update existing gist
          const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${token}`,
              'User-Agent': 'SENAI-Estoque-SP-App',
            },
            body: JSON.stringify({
              description: `SENAI-SP Estoque Backup - Sincronizado em ${new Date().toLocaleString('pt-BR')}`,
              files: {
                'senai_estoque_data.json': {
                  content: contentStr,
                },
              },
            }),
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`GitHub Gist API error (${response.status}): ${errBody}`);
          }

          const resJson: any = await response.json();
          db.githubConfig = {
            ...db.githubConfig,
            token,
            mode: 'gist',
            gistId,
            lastSync: new Date().toISOString(),
            lastStatus: 'success',
            lastMessage: `Sincronizado com sucesso no Gist ${gistId}`,
          };
          writeDbFile(db);

          return res.json({
            success: true,
            gistId: resJson.id,
            url: resJson.html_url,
            message: 'Backup enviado com sucesso para o GitHub Gist',
          });
        } else {
          // Create new gist
          const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${token}`,
              'User-Agent': 'SENAI-Estoque-SP-App',
            },
            body: JSON.stringify({
              description: `SENAI-SP Estoque Backup Oficial - Criado em ${new Date().toLocaleString('pt-BR')}`,
              public: false,
              files: {
                'senai_estoque_data.json': {
                  content: contentStr,
                },
              },
            }),
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`GitHub Gist create error (${response.status}): ${errBody}`);
          }

          const resJson: any = await response.json();
          db.githubConfig = {
            ...db.githubConfig,
            token,
            mode: 'gist',
            gistId: resJson.id,
            lastSync: new Date().toISOString(),
            lastStatus: 'success',
            lastMessage: `Novo Gist criado e sincronizado (${resJson.id})`,
          };
          writeDbFile(db);

          return res.json({
            success: true,
            gistId: resJson.id,
            url: resJson.html_url,
            message: 'Novo GitHub Gist de persistência criado com sucesso!',
          });
        }
      } else {
        // Repository mode
        if (!repoOwner || !repoName) {
          return res.status(400).json({ error: 'Proprietário e nome do repositório são obrigatórios' });
        }

        const pathInRepo = filePath || 'senai_estoque_data.json';
        const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${pathInRepo}`;

        // Check if file exists to get SHA for update
        let sha: string | undefined;
        const checkRes = await fetch(fileUrl, {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SENAI-Estoque-SP-App',
          },
        });

        if (checkRes.ok) {
          const fileInfo: any = await checkRes.json();
          sha = fileInfo.sha;
        }

        const base64Content = Buffer.from(contentStr, 'utf-8').toString('base64');
        const commitRes = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SENAI-Estoque-SP-App',
          },
          body: JSON.stringify({
            message: `chore(estoque): backup inventário SENAI-SP [${new Date().toISOString()}]`,
            content: base64Content,
            sha,
          }),
        });

        if (!commitRes.ok) {
          const errBody = await commitRes.text();
          throw new Error(`GitHub Repo API error (${commitRes.status}): ${errBody}`);
        }

        const commitData: any = await commitRes.json();
        db.githubConfig = {
          ...db.githubConfig,
          token,
          mode: 'repo',
          repoOwner,
          repoName,
          filePath: pathInRepo,
          lastSync: new Date().toISOString(),
          lastStatus: 'success',
          lastMessage: `Sincronizado no repositório ${repoOwner}/${repoName}`,
        };
        writeDbFile(db);

        return res.json({
          success: true,
          url: commitData.content?.html_url || `https://github.com/${repoOwner}/${repoName}`,
          message: 'Backup enviado e versionado com sucesso no Repositório GitHub!',
        });
      }
    } catch (error: any) {
      console.error('GitHub Sync error:', error);
      res.status(500).json({ error: 'Falha na sincronização com GitHub', details: error.message });
    }
  });

  // Pull data from GitHub
  app.post('/api/inventory/github-pull', async (req: Request, res: Response) => {
    try {
      const { token, mode, gistId, repoOwner, repoName, filePath } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token do GitHub não fornecido' });
      }

      let parsedData: any = null;

      if (mode === 'gist' || !mode) {
        if (!gistId) return res.status(400).json({ error: 'ID do Gist não fornecido' });
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SENAI-Estoque-SP-App',
          },
        });
        if (!response.ok) throw new Error(`Erro ao buscar Gist (${response.status})`);
        const gistJson: any = await response.json();
        const file = gistJson.files?.['senai_estoque_data.json'] || Object.values(gistJson.files || {})[0];
        if (!file || !(file as any).content) throw new Error('Arquivo de estoque não encontrado no Gist');
        parsedData = JSON.parse((file as any).content);
      } else {
        if (!repoOwner || !repoName) return res.status(400).json({ error: 'Repositório não informado' });
        const pathInRepo = filePath || 'senai_estoque_data.json';
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${pathInRepo}`, {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SENAI-Estoque-SP-App',
          },
        });
        if (!response.ok) throw new Error(`Arquivo não encontrado no repositório (${response.status})`);
        const repoFile: any = await response.json();
        const contentStr = Buffer.from(repoFile.content, 'base64').toString('utf-8');
        parsedData = JSON.parse(contentStr);
      }

      if (!parsedData || !Array.isArray(parsedData.articles) || !Array.isArray(parsedData.types)) {
        return res.status(400).json({ error: 'O conteúdo baixado não possui formato válido de inventário SENAI' });
      }

      writeDbFile(parsedData);
      res.json({ success: true, message: 'Dados restaurados do GitHub com sucesso!', db: parsedData });
    } catch (error: any) {
      console.error('GitHub Pull error:', error);
      res.status(500).json({ error: 'Falha ao restaurar dados do GitHub', details: error.message });
    }
  });

  // Frontend mounting
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SENAI Estoque SP] Servidor rodando na porta ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha crítica ao iniciar servidor SENAI Estoque:', err);
  process.exit(1);
});
