import { useMemo, useState } from 'react';
import { ArchiveRestore, Boxes, GitMerge, Link2Off, PackageCheck, Search, Trash2, Wrench } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';

const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

function MiniTable({ children }) {
  return <div className="overflow-x-auto border border-brand-line dark:border-white/10"><table className="w-full min-w-[760px] text-left text-sm">{children}</table></div>;
}
function Th({ children }) { return <th className="border-b border-brand-line bg-brand-light px-3 py-2 text-xs uppercase text-brand-steel dark:border-white/10 dark:bg-white/5 dark:text-white/60">{children}</th>; }
function Td({ children }) { return <td className="border-b border-brand-line px-3 py-2 align-top dark:border-white/10">{children}</td>; }

export default function Organization() {
  const {
    stock, stockRaw, machines, machinesRaw, bomRaw, duplicateGroups, archived, brokenBom,
    archiveStockItem, restoreStockItem, archiveMachine, restoreMachine, mergeMachines, cleanBrokenBom,
    notify
  } = useApp();
  const [tab, setTab] = useState('duplicidades');
  const [mainMachine, setMainMachine] = useState('');
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [q, setQ] = useState('');

  const machineOptions = useMemo(() => machinesRaw.filter(m => m.archived !== true && m.archived !== 'true'), [machinesRaw]);
  const possibleMachineDuplicates = useMemo(() => {
    const groups = duplicateGroups?.machines || [];
    return groups.length ? groups : [];
  }, [duplicateGroups]);
  const archivedStockFiltered = useMemo(() => archived.stock.filter(i => norm(`${i.code} ${i.name}`).includes(norm(q))), [archived.stock, q]);
  const archivedMachineFiltered = useMemo(() => archived.machines.filter(i => norm(`${i.name} ${i.model} ${i.code}`).includes(norm(q))), [archived.machines, q]);

  const toggleMachine = id => setSelectedMachines(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const runMerge = () => {
    if (!mainMachine) return notify('Escolha a máquina principal', 'error');
    mergeMachines(mainMachine, selectedMachines);
    setSelectedMachines([]);
  };

  return (
    <>
      <PageHeader title="Organização" subtitle="Duplicidades, máquinas mescladas, lixeira e vínculos quebrados" />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <button onClick={() => setTab('duplicidades')} className={`btn-${tab === 'duplicidades' ? 'primary' : 'ghost'} justify-center`}><Search size={18}/>Duplicidades</button>
        <button onClick={() => setTab('mesclar')} className={`btn-${tab === 'mesclar' ? 'primary' : 'ghost'} justify-center`}><GitMerge size={18}/>Mesclar máquinas</button>
        <button onClick={() => setTab('arquivados')} className={`btn-${tab === 'arquivados' ? 'primary' : 'ghost'} justify-center`}><ArchiveRestore size={18}/>Arquivados</button>
        <button onClick={() => setTab('vinculos')} className={`btn-${tab === 'vinculos' ? 'primary' : 'ghost'} justify-center`}><Link2Off size={18}/>Vínculos</button>
      </div>

      {tab === 'duplicidades' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <div className="mb-4 flex items-start gap-3"><PackageCheck size={22}/><div><h3 className="text-xl font-semibold">Itens duplicados</h3><p className="text-sm text-brand-steel dark:text-white/60">Agrupamento por código e por nome exatamente normalizado.</p></div></div>
            <div className="grid gap-3">
              <div className="border border-brand-line p-3 dark:border-white/10"><b>Códigos duplicados:</b> {duplicateGroups?.codes?.length || 0}</div>
              <div className="border border-brand-line p-3 dark:border-white/10"><b>Nomes duplicados:</b> {duplicateGroups?.names?.length || 0}</div>
            </div>
            <div className="mt-4 max-h-[420px] overflow-y-auto">
              {[...(duplicateGroups?.codes || []), ...(duplicateGroups?.names || [])].length === 0 ? <p className="text-sm text-brand-steel dark:text-white/60">Nenhum item duplicado encontrado.</p> : (
                <MiniTable><thead><tr><Th>Chave</Th><Th>Itens</Th><Th>Ação</Th></tr></thead><tbody>
                  {[...(duplicateGroups?.codes || []), ...(duplicateGroups?.names || [])].map((g, idx) => <tr key={`${g.key}-${idx}`}><Td>{g.key}</Td><Td>{g.items.map(i => <div key={i.id}>{i.code || '-'} • {i.name} • Qtd {i.qty || 0}</div>)}</Td><Td><span className="text-xs text-brand-steel dark:text-white/60">Conferir antes de arquivar</span></Td></tr>)}
                </tbody></MiniTable>
              )}
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-start gap-3"><Boxes size={22}/><div><h3 className="text-xl font-semibold">Máquinas parecidas</h3><p className="text-sm text-brand-steel dark:text-white/60">Ajuda a achar nomes como Enche Palheiros, Turbo e Vibro Master.</p></div></div>
            {possibleMachineDuplicates.length === 0 ? <p className="text-sm text-brand-steel dark:text-white/60">Nenhuma máquina parecida encontrada pelo agrupamento automático.</p> : (
              <MiniTable><thead><tr><Th>Grupo</Th><Th>Máquinas</Th></tr></thead><tbody>
                {possibleMachineDuplicates.map(g => <tr key={g.key}><Td>{g.key}</Td><Td>{g.items.map(m => <div key={m.id}>{m.name} / {m.model || '-'} • {m.code || '-'}</div>)}</Td></tr>)}
              </tbody></MiniTable>
            )}
          </div>
        </div>
      )}

      {tab === 'mesclar' && (
        <div className="card">
          <div className="mb-4 flex items-start gap-3"><GitMerge size={22}/><div><h3 className="text-xl font-semibold">Mesclar máquinas</h3><p className="text-sm text-brand-steel dark:text-white/60">Move a estrutura das duplicadas para a principal e arquiva as duplicadas. Um backup é baixado antes.</p></div></div>
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Máquina principal
              <select className="input" value={mainMachine} onChange={e => setMainMachine(e.target.value)}>
                <option value="">Selecione...</option>
                {machineOptions.map(m => <option key={m.id} value={m.id}>{m.name} / {m.model || '-'} / {m.code || '-'}</option>)}
              </select>
            </label>
            <div className="border border-brand-line p-3 text-sm dark:border-white/10">
              <b>Selecionadas para mesclar:</b> {selectedMachines.length}
              <button className="btn-warning mt-3 w-full justify-center" onClick={runMerge}><GitMerge size={18}/>Mesclar selecionadas</button>
            </div>
          </div>
          <MiniTable><thead><tr><Th></Th><Th>Máquina</Th><Th>Código</Th><Th>Itens vinculados</Th><Th>Ação</Th></tr></thead><tbody>
            {machineOptions.map(m => <tr key={m.id}>
              <Td><input type="checkbox" disabled={m.id === mainMachine} checked={selectedMachines.includes(m.id)} onChange={() => toggleMachine(m.id)} /></Td>
              <Td>{m.name}<br/><span className="text-xs text-brand-steel dark:text-white/60">{m.model || '-'}</span></Td>
              <Td>{m.code || '-'}</Td>
              <Td>{bomRaw.filter(l => l.machineId === m.id && l.archived !== true && l.archived !== 'true').length}</Td>
              <Td><button className="btn-ghost py-1" onClick={() => archiveMachine(m.id)}><Trash2 size={15}/>Arquivar</button></Td>
            </tr>)}
          </tbody></MiniTable>
        </div>
      )}

      {tab === 'arquivados' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card xl:col-span-2">
            <label className="grid gap-2 text-sm font-semibold">Buscar arquivados
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Código, nome, máquina..." />
            </label>
          </div>
          <div className="card">
            <h3 className="mb-3 text-xl font-semibold">Itens arquivados ({archivedStockFiltered.length})</h3>
            <div className="max-h-[460px] overflow-y-auto">
              <MiniTable><thead><tr><Th>Código</Th><Th>Nome</Th><Th>Qtd</Th><Th>Ação</Th></tr></thead><tbody>
                {archivedStockFiltered.map(i => <tr key={i.id}><Td>{i.code || '-'}</Td><Td>{i.name}</Td><Td>{i.qty || 0}</Td><Td><button className="btn-primary py-1" onClick={() => restoreStockItem(i.id)}><ArchiveRestore size={15}/>Restaurar</button></Td></tr>)}
              </tbody></MiniTable>
            </div>
          </div>
          <div className="card">
            <h3 className="mb-3 text-xl font-semibold">Máquinas arquivadas ({archivedMachineFiltered.length})</h3>
            <div className="max-h-[460px] overflow-y-auto">
              <MiniTable><thead><tr><Th>Nome</Th><Th>Modelo</Th><Th>Código</Th><Th>Ação</Th></tr></thead><tbody>
                {archivedMachineFiltered.map(m => <tr key={m.id}><Td>{m.name}</Td><Td>{m.model || '-'}</Td><Td>{m.code || '-'}</Td><Td><button className="btn-primary py-1" onClick={() => restoreMachine(m.id)}><ArchiveRestore size={15}/>Restaurar</button></Td></tr>)}
              </tbody></MiniTable>
            </div>
          </div>
        </div>
      )}

      {tab === 'vinculos' && (
        <div className="card">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3"><Wrench size={22}/><div><h3 className="text-xl font-semibold">Vínculos quebrados da estrutura</h3><p className="text-sm text-brand-steel dark:text-white/60">Linhas da BOM apontando para item ou máquina inexistente/arquivada.</p></div></div>
            <button className="btn-warning" onClick={cleanBrokenBom}><Link2Off size={18}/>Arquivar vínculos quebrados</button>
          </div>
          {brokenBom.length === 0 ? <p className="text-sm text-brand-steel dark:text-white/60">Nenhum vínculo quebrado encontrado.</p> : (
            <MiniTable><thead><tr><Th>Item</Th><Th>Máquina</Th><Th>Setor</Th><Th>Qtd</Th></tr></thead><tbody>
              {brokenBom.map(l => <tr key={l.id}><Td>{l.itemName}<br/><span className="text-xs text-brand-steel dark:text-white/60">{l.productId}</span></Td><Td>{l.machineName}<br/><span className="text-xs text-brand-steel dark:text-white/60">{l.machineId}</span></Td><Td>{l.sector || '-'}</Td><Td>{l.qty || 0}</Td></tr>)}
            </tbody></MiniTable>
          )}
        </div>
      )}
    </>
  );
}
