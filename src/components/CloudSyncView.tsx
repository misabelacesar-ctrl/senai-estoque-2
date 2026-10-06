import React, { useState } from 'react';
import {
  Cloud,
  Github,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Shield,
  FileJson,
  Key,
  FolderGit2
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { GitHubSyncConfig } from '../types/inventory';
import { formatDateTimeBR } from '../utils/codeGenerator';

export const CloudSyncView: React.FC = () => {
  const {
    database,
    serverOnline,
    saveGitHubConfig,
    syncToGitHub,
    pullFromGitHub,
    exportJsonBackup,
    importJsonBackup,
  } = useInventory();

  const [token, setToken] = useState(database.githubConfig.token || '');
  const [mode, setMode] = useState<'gist' | 'repo'>(database.githubConfig.mode || 'gist');
  const [gistId, setGistId] = useState(database.githubConfig.gistId || '');
  const [repoOwner, setRepoOwner] = useState(database.githubConfig.repoOwner || '');
  const [repoName, setRepoName] = useState(database.githubConfig.repoName || 'senai-estoque-backup');
  const [filePath, setFilePath] = useState(database.githubConfig.filePath || 'senai_estoque_data.json');
  const [autoSync, setAutoSync] = useState(database.githubConfig.autoSync ?? false);

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setFeedbackMessage(null);

    try {
      const newConfig: GitHubSyncConfig = {
        enabled: !!token.trim(),
        token: token.trim(),
        mode,
        gistId: gistId.trim(),
        repoOwner: repoOwner.trim(),
        repoName: repoName.trim(),
        filePath: filePath.trim(),
        autoSync,
        lastStatus: database.githubConfig.lastStatus,
        lastMessage: database.githubConfig.lastMessage,
      };

      await saveGitHubConfig(newConfig);
      setFeedbackMessage({
        type: 'success',
        text: 'Configurações de sincronização com GitHub salvas com sucesso!',
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erro ao salvar configuração do GitHub',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSyncNow = async () => {
    if (!token.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, informe seu Personal Access Token do GitHub antes de sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setFeedbackMessage(null);

    const result = await syncToGitHub();
    if (result.success) {
      setFeedbackMessage({
        type: 'success',
        text: result.message,
        url: result.url,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: result.message,
      });
    }
    setIsSyncing(false);
  };

  const handlePullNow = async () => {
    if (!token.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Informe seu token do GitHub para restaurar os dados.',
      });
      return;
    }

    if (!confirm('Atenção: Restaurar os dados do GitHub substituirá a base de dados atual deste aplicativo. Deseja continuar?')) {
      return;
    }

    setIsPulling(true);
    setFeedbackMessage(null);

    const result = await pullFromGitHub();
    if (result.success) {
      setFeedbackMessage({
        type: 'success',
        text: result.message,
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: result.message,
      });
    }
    setIsPulling(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.articles || !parsed.types) {
          throw new Error('Arquivo não possui o esquema de dados do inventário SENAI.');
        }

        if (confirm(`Confirma a importação do arquivo com ${parsed.articles.length} artigos e ${parsed.types.length} tipos hierárquicos?`)) {
          await importJsonBackup(parsed);
          setFeedbackMessage({
            type: 'success',
            text: 'Backup restaurado com sucesso!',
          });
        }
      } catch (err: any) {
        setFeedbackMessage({
          type: 'error',
          text: `Erro ao importar arquivo: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Persistência & Nuvem
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Armazenamento em Nuvem (GitHub & Google Drive)
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Garantia de persistência integral dos dados entre sessões, com versionamento de estoque e exportação de backups.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportJsonBackup}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Arquivo JSON (Drive)</span>
          </button>
        </div>
      </div>

      {/* Status da Persistência Atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Persistência Local & Servidor
            </div>
            <div className="text-xs font-black text-neutral-900 mt-0.5">
              {serverOnline ? 'Ativa no Servidor Node.js' : 'Ativa no Navegador (LocalStorage)'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Última gravação: {formatDateTimeBR(database.lastUpdated)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-lg ${
              database.githubConfig.lastStatus === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <Github className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Sincronização com GitHub
            </div>
            <div className="text-xs font-black text-neutral-900 mt-0.5">
              {database.githubConfig.lastStatus === 'success'
                ? 'Sincronizado na Nuvem'
                : database.githubConfig.enabled
                ? 'Configurado / Pendente'
                : 'Não Configurado'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {database.githubConfig.lastSync
                ? `Em ${formatDateTimeBR(database.githubConfig.lastSync)}`
                : 'Nenhum envio recente'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Google Drive / Arquivo
            </div>
            <div className="text-xs font-black text-neutral-900 mt-0.5">
              Compatível com Google Drive
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Exportação JSON padronizada
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-start space-x-2.5 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <div>
            <span className="font-semibold">{feedbackMessage.text}</span>
            {feedbackMessage.url && (
              <a
                href={feedbackMessage.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-emerald-700 underline font-bold flex items-center space-x-1"
              >
                <span>Ver arquivo e histórico de versões no GitHub</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Seção 1: Armazenamento em Nuvem GitHub */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between border-b-2 border-[#E30613]">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Persistência com Versionamento em Nuvem via GitHub
            </h3>
          </div>
          <span className="text-[11px] bg-[#E30613] text-white font-bold px-2 py-0.5 rounded">
            Recomendado para Versionamento
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="p-6 space-y-5">
          <p className="text-xs text-neutral-600 leading-relaxed">
            O GitHub armazena a base de dados de estoque do SENAI-SP com <strong>histórico de versões (commits)</strong> para cada alteração. Você pode salvar via <strong>GitHub Gist Privado</strong> (automático e simples) ou em um <strong>Repositório</strong> próprio.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-neutral-500" />
                <span>GitHub Personal Access Token (PAT) *</span>
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded focus:border-[#E30613] outline-none"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Crie em GitHub → Settings → Developer Settings → Personal Access Tokens com escopo <strong>gist</strong> ou <strong>repo</strong>.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Modo de Armazenamento
                </label>
                <div className="flex items-center space-x-4 text-xs font-medium pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="gist"
                      checked={mode === 'gist'}
                      onChange={() => setMode('gist')}
                      className="accent-[#E30613]"
                    />
                    <span>GitHub Gist (Recomendado)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="repo"
                      checked={mode === 'repo'}
                      onChange={() => setMode('repo')}
                      className="accent-[#E30613]"
                    />
                    <span>Repositório GitHub</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Sincronização Contínua
                </label>
                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={e => setAutoSync(e.target.checked)}
                    className="accent-[#E30613] w-4 h-4 rounded"
                  />
                  <span>Sincronizar no GitHub automaticamente a cada movimentação</span>
                </label>
              </div>
            </div>

            {mode === 'gist' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  ID do Gist (Opcional - deixe vazio para criar um novo)
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para que o sistema crie um novo Gist automaticamente"
                  value={gistId}
                  onChange={e => setGistId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Dono do Repo (Username/Org)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: senai-sp-labs"
                    value={repoOwner}
                    onChange={e => setRepoOwner(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nome do Repositório
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: controle-estoque-senai"
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nome do Arquivo
                  </label>
                  <input
                    type="text"
                    placeholder="senai_estoque_data.json"
                    value={filePath}
                    onChange={e => setFilePath(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              {isSavingConfig ? 'Gravando...' : 'Salvar Configurações'}
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSyncing ? 'Sincronizando...' : 'Enviar para GitHub (Push)'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullNow}
                disabled={isPulling}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-all border border-neutral-700 flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Baixando...' : 'Puxar do GitHub (Pull)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Seção 2: Armazenamento e Backup Google Drive */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between border-b-2 border-blue-600">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Armazenamento em Google Drive (Backup e Sincronização)
            </h3>
          </div>
          <span className="text-[11px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
            Google Workspace
          </span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Você pode armazenar e sincronizar seus dados diretamente com seu <strong>Google Drive</strong>. Exporte o arquivo de estado oficial a qualquer momento e salve na pasta de inventário do seu Drive. Para restaurar ou testar em outro computador, selecione o arquivo correspondente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Download */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Exportar para Google Drive</span>
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Gera arquivo padronizado contendo toda a hierarquia, artigos, localizações e movimentações.
                </p>
              </div>
              <button
                onClick={exportJsonBackup}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors w-full flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup para o Drive</span>
              </button>
            </div>

            {/* Upload */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Restaurar Arquivo do Google Drive</span>
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Selecione um arquivo de backup (.json) para carregar imediatamente no banco de dados.
                </p>
              </div>
              <label className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer text-center block">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span>Carregar Arquivo do Drive</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
