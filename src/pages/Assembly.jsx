import { useMemo, useState } from 'react';
import { CheckCircle2, Factory, Minus, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormGrid, { Field } from '../components/FormGrid';
import { useApp } from '../context/AppContext';
import { calcMachineCost, currency, num } from '../utils/costs';

const sectors = ['Estrutura', 'Elétrica', 'Vibração', 'Pintura', 'Soldagem', 'Fixadores', 'Usinagem', 'Esteiras', 'Consumíveis', 'Manutenção'];
const blankLine = { productId: '', sector: 'Estrutura', qty: 1 };

export default function Assembly() {
  const { machines, stock, bom, setBom, setStock, addMovement, rid, notify } = useApp();
  const [machineId, setMachineId] = useState(machines[0]?.id || '');
  const [edit, setEdit] = useState(null);
  const [query, setQuery] = useState('');
  const machine = machines.find(m => m.id === machineId);

  const cost = useMemo(() => machine ? calcMachineCost(machine, bom, stock) : { lines: [], materials: 0, total: 0, price: 0 }, [machine, bom, stock]);
  const lines = useMemo(() => cost.lines.filter(l => `${l.product?.name || ''} ${l.product?.code || ''} ${l.sector}`.toLowerCase().includes(query.toLowerCase())), [cost.lines, query]);
  const missing = cost.lines.filter(l => !l.product || num(l.product.qty) < num(l.qty));
  const ready = !!machine && cost.lines.length > 0 && missing.length === 0;

  const saveLine = () => {
    if (!machineId) return notify('Selecione uma máquina', 'error');
    if (!edit?.productId) return notify('Selecione um item do estoque', 'error');
    const clean = { ...edit, machineId, qty: Math.max(1, num(edit.qty)) };
    setBom(list => clean.id ? list.map(i => i.id === clean.id ? clean : i) : [{ ...clean, id: rid('b') }, ...list]);
    setEdit(null);
    notify('Item adicionado à montagem');
  };

  const removeLine = (id) => {
    setBom(list => list.filter(i => i.id !== id));
    notify('Item removido da montagem');
  };

  const assembleMachine = () => {
    if (!ready) return notify('Ainda existem itens faltando para montar esta máquina', 'error');
    const code = `MONT-${new Date().toISOString().slice(0, 10)}-${machine.code || machine.name}`;
    setStock(current => current.map(item => {
      const used = cost.lines.filter(l => l.productId === item.id).reduce((sum, l) => sum + num(l.qty), 0);
      return used > 0 ? { ...item, qty: Math.max(0, num(item.qty) - used), reserved: 0 } : item;
    }));
    cost.lines.forEach(l => addMovement({ type: 'saída', item: l.product?.name || 'Item', qty: l.qty, reason: `Montagem ${machine.name}`, op: code }));
    notify('Máquina montada e estoque baixado');
  };

  const productOptions = stock.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const machineOptions = machines.map(m => ({ value: m.id, label: `${m.name} ${m.model ? `- ${m.model}` : ''}` }));

  const cols = [
    { key: 'sector', label: 'Setor' },
    { key: 'product', label: 'Item necessário', render: r => <div><b>{r.product?.name || 'Produto removido'}</b><p className="text-xs text-brand-steel">{r.product?.code || '-'}</p></div> },
    { key: 'qty', label: 'Qtd. necessária', render: r => `${r.qty} ${r.product?.unit || ''}` },
    { key: 'stock', label: 'Estoque atual', render: r => r.product ? `${r.product.qty} ${r.product.unit || ''}` : '-' },
    { key: 'faltando', label: 'Falta', render: r => { const falta = Math.max(0, num(r.qty) - num(r.product?.qty)); return falta ? <span className="badge bg-brand-red text-white">{falta}</span> : <span className="badge bg-green-100 text-green-700">OK</span>; } },
    { key: 'cost', label: 'Custo', render: r => currency(r.total) },
    { key: 'actions', label: 'Ações', render: r => <div className="flex gap-2"><button className="btn-ghost p-2" title="Alterar" onClick={() => setEdit({ id: r.id, productId: r.productId, sector: r.sector, qty: r.qty })}><Plus size={15} /></button><button className="btn-ghost p-2 text-brand-red" title="Remover" onClick={() => removeLine(r.id)}><Trash2 size={15} /></button></div> }
  ];

  return <>
    <PageHeader
      title="Montar máquina"
      subtitle="Aba separada para definir exatamente quais itens do estoque entram em cada máquina"
      actions={<button className="btn-primary" onClick={() => setEdit({ ...blankLine, productId: stock[0]?.id || '' })}><Plus size={18} />Adicionar item</button>}
    />

    <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
      <section className="space-y-4">
        <div className="card grid gap-3 md:grid-cols-[1fr,260px]">
          <label className="grid gap-1 text-sm font-semibold">
            <span>Máquina / modelo</span>
            <select className="input" value={machineId} onChange={e => setMachineId(e.target.value)}>
              {machineOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 self-end border border-brand-line bg-white px-3 py-2 dark:border-white/10 dark:bg-white/10">
            <Search size={18} />
            <input className="flex-1 bg-transparent outline-none" placeholder="Buscar item na montagem..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>
        </div>

        <div className="border border-brand-line bg-white p-4 text-sm dark:border-white/10 dark:bg-brand-graphite">
          <div className="mb-2 flex items-center gap-2 font-semibold"><Factory size={18} />Como funciona</div>
          <p className="text-brand-steel dark:text-white/70">Aqui você monta a receita da máquina. O estoque fica apenas com os produtos cadastrados. Nesta aba você escolhe a máquina e informa quais itens específicos ela precisa. Ao clicar em <b>Montar e baixar estoque</b>, o sistema confere se tem material suficiente e baixa as quantidades usadas.</p>
        </div>

        <DataTable columns={cols} rows={lines} empty="Nenhum item nesta máquina. Clique em Adicionar item para montar a estrutura." />
      </section>

      <aside className="space-y-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-brand-steel">Resumo da máquina</p>
          <h2 className="mt-2 text-2xl font-semibold">{machine?.name || 'Selecione'}</h2>
          <p className="text-sm text-brand-steel">{machine?.model}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between"><span>Itens na montagem</span><b>{cost.lines.length}</b></div>
            <div className="flex justify-between"><span>Itens faltando</span><b className={missing.length ? 'text-brand-red' : 'text-green-600'}>{missing.length}</b></div>
            <div className="flex justify-between"><span>Custo de materiais</span><b>{currency(cost.materials)}</b></div>
            <div className="flex justify-between"><span>Custo total</span><b>{currency(cost.total)}</b></div>
            <div className="flex justify-between"><span>Preço sugerido</span><b>{currency(cost.price)}</b></div>
          </div>
          <button className="btn-primary mt-5 w-full" disabled={!ready} onClick={assembleMachine}><CheckCircle2 size={18} />Montar e baixar estoque</button>
          {!ready && <p className="mt-3 text-xs text-brand-steel">Para liberar a montagem, cadastre itens e resolva as faltas de estoque.</p>}
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase text-brand-steel">Faltas</p>
          <div className="mt-3 space-y-2">
            {missing.length ? missing.map(l => <div key={l.id} className="border border-brand-line p-3 text-sm dark:border-white/10"><b>{l.product?.name || 'Produto removido'}</b><p className="text-brand-red">Falta {Math.max(0, num(l.qty) - num(l.product?.qty))} {l.product?.unit || ''}</p></div>) : <p className="text-sm text-brand-steel">Nenhum item faltando.</p>}
          </div>
        </div>
      </aside>
    </div>

    <Modal open={!!edit} title="Item da montagem" onClose={() => setEdit(null)}>
      <FormGrid>
        <Field label="Item do estoque" value={edit?.productId} options={productOptions} onChange={v => setEdit({ ...edit, productId: v })} />
        <Field label="Setor da máquina" value={edit?.sector} options={sectors} onChange={v => setEdit({ ...edit, sector: v })} />
        <Field label="Quantidade necessária" type="number" min="1" step="1" value={edit?.qty} onChange={v => setEdit({ ...edit, qty: v })} />
      </FormGrid>
      <button className="btn-primary mt-5" onClick={saveLine}>Salvar na montagem</button>
    </Modal>
  </>;
}
