import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Boxes, ClipboardList, Cog, Factory, FileBarChart, Hammer, Home, LogOut, Menu, Package, PackagePlus, ShoppingCart, Truck, Wrench, Moon, Sun, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { statusOf } from '../utils/costs';

const nav = [
  ['/', 'Dashboard', Home],
  ['/estoque', 'Estoque', Boxes],
  ['/produtos', 'Produtos', Package],
  ['/maquinas', 'Máquinas', Factory],
  ['/montagem', 'Montar Máquina', Factory],
  ['/bom', 'BOM / Estrutura', ClipboardList],
  ['/movimentacoes', 'Movimentações', PackagePlus],
  ['/compras', 'Compras', ShoppingCart],
  ['/fornecedores', 'Fornecedores', Truck],
  ['/ops', 'Ordens de Produção', Hammer],
  ['/manutencao', 'Manutenção', Wrench],
  ['/garantias', 'Garantias / WhatsApp', ShieldCheck],
  ['/relatorios', 'Relatórios', FileBarChart],
  ['/configuracoes', 'Configurações', Cog],
];

function LowStockNotifications({ items }) {
  const [open, setOpen] = useState(false);
  const ordered = useMemo(() => [...items].sort((a, b) => {
    const priority = { 'Em falta': 0, 'Estoque baixo': 1, OK: 2 };
    return (priority[statusOf(a)] ?? 9) - (priority[statusOf(b)] ?? 9) || a.name.localeCompare(b.name);
  }), [items]);

  return (
    <div className="relative">
      <button className="btn-ghost relative" onClick={() => setOpen(v => !v)} title="Alertas de estoque mínimo">
        <Bell size={18} />
        {items.length > 0 && <span className="absolute -right-1 -top-1 rounded-none bg-brand-yellow px-1.5 text-xs text-brand-black">{items.length}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,420px)] border border-brand-line bg-white shadow-industrial dark:border-white/10 dark:bg-[#101010]">
          <div className="flex items-start justify-between gap-3 border-b border-brand-line p-4 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">Estoque mínimo</p>
              <p className="text-xs text-brand-steel dark:text-white/60">
                {items.length ? `${items.length} item(ns) precisam de atenção.` : 'Nenhum item abaixo do mínimo.'}
              </p>
            </div>
            <button className="btn-ghost p-2" onClick={() => setOpen(false)} title="Fechar"><X size={16} /></button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {ordered.length === 0 ? (
              <div className="p-5 text-sm text-brand-steel dark:text-white/60">Tudo certo no estoque.</div>
            ) : ordered.map(item => (
              <NavLink
                to="/estoque"
                key={item.id}
                onClick={() => setOpen(false)}
                className="grid gap-1 border-b border-brand-line p-3 text-sm transition hover:bg-brand-light dark:border-white/10 dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{item.name}</span>
                  <span className={`badge ${statusOf(item) === 'Em falta' ? 'bg-brand-red text-white' : 'bg-brand-yellow text-brand-black'}`}>{statusOf(item)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-brand-steel dark:text-white/60">
                  <span>Atual: <b>{item.qty}</b></span>
                  <span>Mínimo: <b>{item.min}</b></span>
                  <span>Unid.: <b>{item.unit}</b></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-red">
                  <AlertTriangle size={14} />
                  <span>{item.code} • {item.application || 'Estoque geral'}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { settings, setSettings, toast, totals, setAuth, dbStatus } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navg = useNavigate();
  const logout = () => { setMobileMenuOpen(false); setAuth({ logged: false }); navg('/login'); };

  return (
    <main className="min-h-screen bg-brand-light text-brand-black dark:bg-brand-black dark:text-white">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 max-w-[86vw] flex-col border-r border-brand-line bg-white transition-transform duration-300 dark:border-white/10 dark:bg-[#101010] lg:z-20 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-brand-line p-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo-gift.png" className="h-14 w-20 object-contain" />
            <div>
              <p className="text-xs font-semibold text-brand-turquoise">GIFT EXCELLENCE</p>
              <h1 className="text-sm font-semibold leading-tight">ALMOXARIFADO</h1>
            </div>
          </div>
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileMenuOpen(false)} title="Fechar menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-none px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-turquoise text-brand-black shadow-industrial' : 'hover:bg-brand-light dark:hover:bg-white/10'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 grid gap-2 border border-white/10 bg-brand-black p-4 text-white">
          <p className="text-xs text-white/60">Alertas de estoque</p>
          <p className="text-2xl font-semibold text-brand-yellow">{totals.low.length}</p>
          <button className="btn-danger py-2" onClick={logout}><LogOut size={16} />Sair</button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/45 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <section className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-brand-line bg-white/85 px-4 glass dark:border-white/10 dark:bg-[#101010]/85 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu" title="Abrir menu"><Menu size={20} /></button>
            <img src="/logo-gift.png" className="h-12 w-20 object-contain lg:hidden" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight lg:text-2xl">ALMOXARIFADO GIFT EXCELLENCE</h2>
              <p className="text-xs text-brand-steel dark:text-white/60">Industrial, estoque, produção, compras e custos • {dbStatus}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LowStockNotifications items={totals.low} />
            <button onClick={() => setSettings({ ...settings, dark: !settings.dark })} className="btn-ghost">{settings.dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={logout} className="btn-ghost hidden md:flex"><LogOut size={18} />Sair</button>
          </div>
        </header>
        <div className="p-4 lg:p-8"><Outlet /></div>
      </section>
      {toast && <div className={`fixed bottom-6 right-6 z-50 rounded-none px-5 py-3 font-semibold text-white shadow-industrial ${toast.type === 'error' ? 'bg-red-700' : 'bg-brand-turquoise text-brand-black'}`}>{toast.message}</div>}
    </main>
  );
}
