import { Activity, AlertTriangle, CalendarClock, Database, Download, RotateCcw, Save, ShieldCheck, Type, Upload } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FormGrid, { Field } from '../components/FormGrid';
import { useApp } from '../context/AppContext';
import { tableNames } from '../services/databaseService';

export default function Settings() {
  const {
    settings,
    setSettings,
    notify,
    backup,
    restore,
    resetDemo,
    setAuth,
    dbStatus,
    isSupabaseConfigured,
    uppercaseStockItemNames,
    exportSafetyBackup,
    dbHealth,
    backupSettings,
    setBackupSettings,
    runDailyBackupIfNeeded
  } = useApp();

  const importFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        if (!window.confirm('Antes de importar, o sistema vai baixar um backup de segurança do estado atual. Deseja continuar?')) return;
        restore(JSON.parse(r.result));
      } catch {
        notify('Arquivo de backup inválido', 'error');
      }
    };
    r.readAsText(f);
  };

  const handleUppercase = () => {
    if (!isSupabaseConfigured) {
      notify('Supabase não configurado', 'error');
      return;
    }
    if (window.confirm('Isso vai criar backup local e backup no Supabase, depois deixar todos os nomes dos itens em MAIÚSCULO. Deseja continuar?')) {
      uppercaseStockItemNames();
    }
  };

  const healthCards = [
    ['Itens ativos', dbHealth?.items ?? 0],
    ['Sem código', dbHealth?.withoutCode ?? 0],
    ['Sem nome', dbHealth?.withoutName ?? 0],
    ['Sem valor', dbHealth?.withoutValue ?? 0],
    ['Sem categoria', dbHealth?.withoutCategory ?? 0],
    ['Sem unidade', dbHealth?.withoutUnit ?? 0],
    ['Sem estoque mínimo', dbHealth?.withoutMin ?? 0],
    ['Códigos duplicados', dbHealth?.duplicateCodes ?? 0],
    ['Máquinas duplicadas', dbHealth?.duplicateMachines ?? 0],
    ['Vínculos quebrados', dbHealth?.brokenBom ?? 0],
    ['Itens arquivados', dbHealth?.archivedItems ?? 0],
    ['Máquinas arquivadas', dbHealth?.archivedMachines ?? 0]
  ];

  return (
    <>
      <PageHeader title="Configurações" subtitle="Tema, Supabase, segurança, backup e manutenção" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-6 flex items-center gap-4">
            <img src="/logo-gift.png" className="h-20 w-28 bg-white object-contain p-2" />
            <div>
              <h3 className="text-xl font-semibold">GIFT EXCELLENCE</h3>
              <p className="text-brand-steel dark:text-white/60">Tema industrial minimalista com vermelho, preto, branco e cinza.</p>
            </div>
          </div>
          <FormGrid>
            <Field label="Usuário padrão" value={settings.user} onChange={v => setSettings({ ...settings, user: v })} />
            <Field label="Tema" value={settings.dark ? 'Escuro' : 'Claro'} options={['Claro', 'Escuro']} onChange={v => setSettings({ ...settings, dark: v === 'Escuro' })} />
            <Field label="Perfil" value="Administrador" options={['Administrador', 'Almoxarifado', 'Compras', 'Produção', 'Manutenção', 'Financeiro', 'Consulta']} onChange={() => {}} />
            <Field label="Senha simples" value="asd123" disabled onChange={() => {}} />
          </FormGrid>
          <button className="btn-primary mt-5" onClick={() => notify('Configurações salvas')}><Save size={18} />Salvar configurações</button>
          <button className="btn-danger ml-2 mt-5" onClick={() => setAuth({ logged: false })}>Sair</button>
        </div>

        <div className="card">
          <div className="mb-4 flex items-start gap-3">
            <Database size={22} />
            <div>
              <h3 className="text-xl font-semibold">Banco de dados Supabase</h3>
              <p className="text-sm text-brand-steel dark:text-white/60">Status: <b>{dbStatus}</b>. {isSupabaseConfigured ? 'Salvando no Supabase.' : 'Sem variáveis .env; usando modo local.'}</p>
            </div>
          </div>

          <div className="mb-5 border border-brand-line p-4 text-sm dark:border-white/10">
            <p className="mb-2 font-semibold">Tabelas únicas configuradas:</p>
            <div className="grid gap-1 font-mono text-xs text-brand-steel dark:text-white/70">
              {Object.values(tableNames).map(t => <span key={t}>{t}</span>)}
            </div>
          </div>

          <div className="mb-5 border border-brand-line p-4 dark:border-white/10">
            <div className="mb-3 flex items-start gap-3">
              <ShieldCheck size={20} />
              <div>
                <h3 className="text-lg font-semibold">Segurança antes de ações perigosas</h3>
                <p className="text-sm text-brand-steel dark:text-white/60">Baixa um backup JSON imediato do estado atual antes de qualquer limpeza, importação ou padronização.</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => { exportSafetyBackup('manual-configuracoes'); notify('Backup de segurança baixado'); }}><Download size={18} />Backup de segurança agora</button>
            <div className="mt-4 border border-brand-line p-4 dark:border-white/10">
              <div className="mb-3 flex items-start gap-3">
                <CalendarClock size={20} />
                <div>
                  <h3 className="text-lg font-semibold">Backup automático diário</h3>
                  <p className="text-sm text-brand-steel dark:text-white/60">Quando o app for aberto no dia, ele baixa automaticamente um JSON de segurança uma vez por dia.</p>
                  <p className="mt-1 text-xs text-brand-steel dark:text-white/60">Último backup: <b>{backupSettings?.lastDailyBackupAt ? new Date(backupSettings.lastDailyBackupAt).toLocaleString('pt-BR') : 'Ainda não executado'}</b></p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className={backupSettings?.dailyEnabled?'btn-primary':'btn-ghost'} onClick={() => setBackupSettings({ ...backupSettings, dailyEnabled: !backupSettings?.dailyEnabled })}>{backupSettings?.dailyEnabled?'Backup diário ligado':'Backup diário desligado'}</button>
                <button className="btn-ghost" onClick={() => { setBackupSettings({ ...backupSettings, lastDailyBackupDate: '' }); setTimeout(runDailyBackupIfNeeded, 100); notify('Backup diário forçado'); }}><Download size={18}/>Testar backup diário agora</button>
              </div>
            </div>
          </div>

          <div className="mb-5 border border-brand-line p-4 dark:border-white/10">
            <div className="mb-3 flex items-start gap-3">
              <Type size={20} />
              <div>
                <h3 className="text-lg font-semibold">Padronização do estoque</h3>
                <p className="text-sm text-brand-steel dark:text-white/60">Cria backup e transforma somente os nomes dos itens do estoque em letra maiúscula.</p>
              </div>
            </div>
            <button className="btn-warning" disabled={!isSupabaseConfigured} onClick={handleUppercase}><Type size={18} />Padronizar nomes em maiúsculo</button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-start gap-3">
            <Activity size={22} />
            <div>
              <h3 className="text-xl font-semibold">Saúde do banco</h3>
              <p className="text-sm text-brand-steel dark:text-white/60">Resumo rápido para achar riscos antes de trabalhar no estoque.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {healthCards.map(([label, value]) => (
              <div key={label} className="border border-brand-line p-3 dark:border-white/10">
                <p className="text-xs uppercase text-brand-steel dark:text-white/60">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle size={22} />
            <div>
              <h3 className="text-xl font-semibold">Backup e restauração</h3>
              <p className="text-sm text-brand-steel dark:text-white/60">A importação baixa backup antes. Zerar dados agora exige digitar uma frase de confirmação.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={backup}><Download size={18} />Exportar backup JSON</button>
            <label className="btn-ghost cursor-pointer"><Upload size={18} />Importar backup<input type="file" accept="application/json" className="hidden" onChange={importFile} /></label>
            <button className="btn-danger" onClick={resetDemo}><RotateCcw size={18} />Zerar dados protegido</button>
          </div>
          <div className="mt-6 border border-brand-line p-4 dark:border-white/10">
            <h4 className="font-semibold">Deploy</h4>
            <p className="text-sm text-brand-steel dark:text-white/60">Pronto para Vercel usando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.</p>
          </div>
        </div>
      </div>
    </>
  );
}
