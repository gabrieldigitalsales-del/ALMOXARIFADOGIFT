import LearnedRulesSettings from '../components/LearnedRulesSettings';
import { DEFAULT_COMPANY, readCompany, writeCompany } from '../utils/companyProfile';
import { MENU_ITEMS, menuVisible } from '../utils/menuVisibility';
import { Activity, AlertTriangle, CalendarClock, Database, Download, RotateCcw, Save, ShieldCheck, Type, Upload, Cloud, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormGrid, { Field } from '../components/FormGrid';
import { useApp } from '../context/AppContext';
import { tableNames } from '../services/databaseService';
import { logout as logoutBackend } from '../services/authService';

export default function Settings() {
  const {
    settings,
    setSettings,
    notify,
    backup,
    restore,
    resetDemo,
    setAuth,
    auth,
    dbStatus,
    isSupabaseConfigured,
    uppercaseStockItemNames,
    exportSafetyBackup,
    dbHealth,
    backupSettings,
    setBackupSettings,
    runDailyBackupIfNeeded,
    loadCloudBackups,
    restoreCloudBackup
  } = useApp();
  const [companyProfile,setCompanyProfile] = useState(readCompany);
  const [cloudBackups, setCloudBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const refreshBackups = async () => {
    if (!isSupabaseConfigured || !loadCloudBackups) return;
    setLoadingBackups(true);
    try { setCloudBackups(await loadCloudBackups()); }
    catch (e) { notify('Não consegui carregar os backups em nuvem', 'error'); }
    finally { setLoadingBackups(false); }
  };
  useEffect(() => { refreshBackups(); }, [isSupabaseConfigured]);

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
      <LearnedRulesSettings notify={notify}/>
      <section className="card mb-6 border-l-4 border-l-red-600">
        <div className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-red-600">Emissão de documentos</p><h2 className="mt-1 text-xl font-bold">Dados da Gift Excellence</h2><p className="mt-1 text-sm text-gray-500">Preenchidos automaticamente em Ordens de Serviço e Orçamentos. Você pode editar quando necessário.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{[
          ['legalName','Razão social'],['tradeName','Nome fantasia'],['cnpj','CNPJ'],['stateRegistration','Inscrição Estadual (MG)'],
          ['address','Endereço'],['district','Bairro'],['city','Cidade'],['state','UF'],['zipCode','CEP'],['phone','Telefone'],['whatsapp','WhatsApp'],['email','E-mail'],['website','Site'],['instagram','Instagram'],['contact','Responsável']
        ].map(([key,label])=><label key={key} className="text-sm font-medium">{label}<input className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-white/20" value={companyProfile[key]||''} onChange={e=>setCompanyProfile(p=>({...p,[key]:e.target.value}))}/></label>)}</div>
        <div className="mt-4 flex flex-wrap gap-2"><button className="btn-primary" onClick={()=>{writeCompany(companyProfile);notify('Dados da empresa salvos localmente')}}><Save size={16}/> Salvar dados da empresa</button><button className="btn-ghost border" onClick={()=>setCompanyProfile({...DEFAULT_COMPANY})}>Restaurar os dados fiscais fornecidos</button></div>
      </section>
      <section className="card mb-6 border-l-4 border-l-red-600">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Abas visíveis no menu</h3><p className="text-sm text-brand-steel dark:text-white/60">Marque o que deseja mostrar. As telas ocultas não são excluídas e continuam acessíveis por endereço e permissões.</p></div><span className="border px-3 py-2 text-xs font-semibold">PERSONALIZAÇÃO LOCAL</span></div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{MENU_ITEMS.map(([path,label])=><label key={path} className="flex cursor-pointer items-center gap-3 border border-brand-line p-3 text-sm font-medium dark:border-white/10"><input type="checkbox" className="h-4 w-4 accent-red-600" checked={menuVisible(settings,path)} disabled={path==='/configuracoes'} onChange={e=>setSettings({...settings,menuVisibility:{...(settings.menuVisibility||{}),[path]:e.target.checked}})} /><span>{label}</span></label>)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button className="btn-ghost border" onClick={()=>setSettings({...settings,menuVisibility:{'/ordens-servico':false}})}>Restaurar abas padrão</button><span className="text-xs text-brand-steel">Ordem de Serviço começa desmarcada. Configurações fica sempre visível.</span></div>
      </section>
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
            <Field label="Senha" value="Protegida no Supabase" disabled onChange={() => {}} />
          </FormGrid>
          <button className="btn-primary mt-5" onClick={() => notify('Configurações salvas')}><Save size={18} />Salvar configurações</button>
          <button className="btn-danger ml-2 mt-5" onClick={async()=>{try{await logoutBackend(auth?.token)}finally{setAuth({logged:false})}}}>Sair</button>
        </div>

        <div className="card">
          <div className="mb-4 flex items-start gap-3">
            <Database size={22} />
            <div>
              <h3 className="text-xl font-semibold">Banco de dados Supabase</h3>
              <p className="text-sm text-brand-steel dark:text-white/60">Status: <b>{dbStatus}</b>. </p>
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
                  <p className="text-sm text-brand-steel dark:text-white/60">Quando o app for aberto no dia, ele salva automaticamente um backup no Supabase uma vez por dia, sem baixar arquivo na tela.</p>
                  <p className="mt-1 text-xs text-brand-steel dark:text-white/60">Último backup: <b>{backupSettings?.lastDailyBackupAt ? new Date(backupSettings.lastDailyBackupAt).toLocaleString('pt-BR') : 'Ainda não executado'}</b>{backupSettings?.lastDailyBackupMode ? ` • ${backupSettings.lastDailyBackupMode}` : ''}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className={backupSettings?.dailyEnabled?'btn-primary':'btn-ghost'} onClick={() => setBackupSettings({ ...backupSettings, dailyEnabled: !backupSettings?.dailyEnabled })}>{backupSettings?.dailyEnabled?'Backup diário ligado':'Backup diário desligado'}</button>
                <button className="btn-ghost" onClick={async () => { await runDailyBackupIfNeeded(true); refreshBackups(); }}><Download size={18}/>Salvar backup diário agora</button>
                <button className="btn-ghost" onClick={refreshBackups}><RefreshCw size={18}/>{loadingBackups ? 'Carregando...' : 'Ver backups salvos'}</button>
              </div>
              {cloudBackups.length > 0 && <div className="mt-4 max-h-72 overflow-auto border border-brand-line dark:border-white/10">{cloudBackups.map(b => <div key={b.id} className="grid gap-2 border-b border-brand-line p-3 text-sm dark:border-white/10 md:grid-cols-[1fr,auto]"><div><b>{b.label}</b><p className="text-xs text-brand-steel dark:text-white/60">{new Date(b.created_at).toLocaleString('pt-BR')} • {b.data?.stock?.length || 0} itens • {b.data?.machines?.length || 0} máquinas</p></div><button className="btn-warning py-2" onClick={() => restoreCloudBackup(b)}><Cloud size={16}/>Restaurar</button></div>)}</div>}
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
