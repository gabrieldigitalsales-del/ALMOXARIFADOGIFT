import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, ClipboardCheck, Copy, FileDown, History, PackageCheck,
  Paperclip, Plus, Printer, Search, Trash2, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { currency, today } from '../utils/costs';

const statuses = ['Rascunho', 'Pendente de aprovação', 'Aprovado', 'Pedido enviado', 'Recebido parcialmente', 'Recebido', 'Recusado', 'Cancelado'];
const emptyItem = () => ({ productId: '', description: '', qty: 1, unitCost: 0, receivedQty: 0 });
const emptyOrder = (supplier = '') => ({
  supplier, requestDate: today(), deliveryDate: '', requester: '', department: 'Almoxarifado',
  status: 'Rascunho', paymentTerms: '', freight: 0, discount: 0, notes: '',
  items: [emptyItem()], attachments: [], history: []
});
const num = v => Number(v || 0);
const subtotal = p => (p.items || []).reduce((sum, item) => sum + num(item.qty) * num(item.unitCost), 0);
const total = p => Math.max(0, subtotal(p) + num(p.freight) - num(p.discount));
const receivedTotal = p => (p.items || []).reduce((sum, item) => sum + num(item.receivedQty), 0);
const orderedTotal = p => (p.items || []).reduce((sum, item) => sum + num(item.qty), 0);

function statusClass(status) {
  if (status === 'Recebido') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Aprovado' || status === 'Pedido enviado') return 'bg-blue-100 text-blue-800';
  if (status === 'Recebido parcialmente') return 'bg-amber-100 text-amber-800';
  if (status === 'Recusado' || status === 'Cancelado') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

export default function Purchases() {
  const { purchases, setPurchases, suppliers, stock, quickMove, rid, notify, settings } = useApp();
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const [receive, setReceive] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const fileRef = useRef(null);

  const nextNumber = () => {
    const year = new Date().getFullYear();
    const max = purchases.reduce((m, p) => {
      const n = Number(String(p.number || '').match(/(\d+)$/)?.[1] || 0);
      return Math.max(m, n);
    }, 0);
    return `OC-${year}-${String(max + 1).padStart(4, '0')}`;
  };

  const addHistory = (order, action) => ({
    ...order,
    history: [{ id: rid(), date: new Date().toISOString(), user: settings.user || 'Usuário', action }, ...(order.history || [])]
  });

  const save = () => {
    if (!edit.supplier) return notify('Informe o fornecedor', 'error');
    if (!(edit.items || []).length || edit.items.some(i => !i.description || num(i.qty) <= 0)) return notify('Preencha corretamente os itens', 'error');
    const record = addHistory({ ...edit, value: total(edit), updatedAt: new Date().toISOString() }, edit.id ? 'Pedido alterado' : 'Pedido criado');
    setPurchases(list => edit.id
      ? list.map(p => p.id === edit.id ? record : p)
      : [{ ...record, id: rid(), number: nextNumber(), createdAt: new Date().toISOString() }, ...list]);
    setEdit(null);
    notify('Ordem de compra salva');
  };

  const updateStatus = (order, status, action) => {
    const next = addHistory({ ...order, status, updatedAt: new Date().toISOString() }, action || `Status alterado para ${status}`);
    setPurchases(list => list.map(p => p.id === order.id ? next : p));
    setView(next);
    notify(action || 'Status atualizado');
  };

  const duplicate = order => {
    const copy = addHistory({ ...order, id: rid(), number: nextNumber(), status: 'Rascunho', requestDate: today(), deliveryDate: '', createdAt: new Date().toISOString(), receivedAt: '', items: order.items.map(i => ({ ...i, receivedQty: 0 })) }, `Duplicado a partir de ${order.number}`);
    setPurchases(list => [copy, ...list]);
    notify('Ordem duplicada');
  };

  const remove = order => {
    if (!confirm(`Excluir ${order.number}?`)) return;
    setPurchases(list => list.filter(p => p.id !== order.id));
    setView(null);
    notify('Ordem excluída');
  };

  const startReceipt = order => setReceive({
    ...order,
    receiptItems: (order.items || []).map(i => ({ ...i, receiveNow: Math.max(0, num(i.qty) - num(i.receivedQty)) }))
  });

  const confirmReceipt = () => {
    let moved = 0;
    const updatedItems = receive.receiptItems.map(item => {
      const remaining = Math.max(0, num(item.qty) - num(item.receivedQty));
      const amount = Math.min(remaining, Math.max(0, num(item.receiveNow)));
      if (amount > 0 && item.productId) {
        quickMove({ productId: item.productId, type: 'entrada', qty: amount, reason: `Recebimento ${receive.number}` });
        moved += amount;
      }
      return { ...item, receivedQty: num(item.receivedQty) + amount, receiveNow: undefined };
    });
    const allReceived = updatedItems.every(i => num(i.receivedQty) >= num(i.qty));
    const anyReceived = updatedItems.some(i => num(i.receivedQty) > 0);
    const status = allReceived ? 'Recebido' : anyReceived ? 'Recebido parcialmente' : receive.status;
    const record = addHistory({ ...receive, items: updatedItems, status, receivedAt: allReceived ? new Date().toISOString() : receive.receivedAt, updatedAt: new Date().toISOString() }, `Recebimento registrado: ${moved} unidade(s)`);
    delete record.receiptItems;
    setPurchases(list => list.map(p => p.id === record.id ? record : p));
    setReceive(null);
    setView(record);
    notify(moved ? 'Recebimento lançado no estoque' : 'Nenhuma quantidade recebida');
  };

  const onFiles = files => {
    const attachments = [...files].map(file => ({ id: rid(), name: file.name, size: file.size, type: file.type, addedAt: new Date().toISOString() }));
    setEdit(cur => ({ ...cur, attachments: [...(cur.attachments || []), ...attachments] }));
  };

  const pdf = order => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('GIFT EXCELLENCE', 14, 18);
    doc.setFontSize(13); doc.text(`ORDEM DE COMPRA ${order.number}`, 14, 27);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Fornecedor: ${order.supplier}`, 14, 38);
    doc.text(`Solicitante: ${order.requester || '-'}`, 14, 44);
    doc.text(`Data: ${order.requestDate || '-'}   Previsão: ${order.deliveryDate || '-'}`, 14, 50);
    doc.text(`Status: ${order.status}`, 14, 56);
    autoTable(doc, {
      startY: 64,
      head: [['Produto / Serviço', 'Qtd.', 'Valor unit.', 'Total']],
      body: (order.items || []).map(i => [i.description, i.qty, currency(i.unitCost), currency(num(i.qty) * num(i.unitCost))]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [20, 20, 20] }
    });
    const y = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${currency(subtotal(order))}`, 196, y, { align: 'right' });
    doc.text(`Frete: ${currency(order.freight)}`, 196, y + 6, { align: 'right' });
    doc.text(`Desconto: ${currency(order.discount)}`, 196, y + 12, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(`VALOR TOTAL: ${currency(total(order))}`, 196, y + 21, { align: 'right' });
    if (order.paymentTerms) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Condição de pagamento: ${order.paymentTerms}`, 14, y + 32); }
    if (order.notes) doc.text(`Observações: ${order.notes}`, 14, y + 40, { maxWidth: 180 });
    doc.save(`${order.number}.pdf`);
  };

  const print = order => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${order.number}</title><style>body{font-family:Arial;padding:32px;color:#111}.head{display:flex;justify-content:space-between;border-bottom:3px solid #111;padding-bottom:14px}h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{border:1px solid #bbb;padding:9px;text-align:left}th{background:#111;color:white}.right{text-align:right}.total{font-size:20px;font-weight:bold;margin-top:16px}</style></head><body><div class="head"><div><h1>GIFT EXCELLENCE</h1><b>ORDEM DE COMPRA ${order.number}</b></div><div>Data: ${order.requestDate || '-'}<br>Status: ${order.status}</div></div><p><b>Fornecedor:</b> ${order.supplier}<br><b>Solicitante:</b> ${order.requester || '-'}<br><b>Previsão:</b> ${order.deliveryDate || '-'}</p><table><tr><th>Produto / Serviço</th><th>Qtd.</th><th>Valor unit.</th><th>Total</th></tr>${order.items.map(i => `<tr><td>${i.description}</td><td>${i.qty}</td><td>${currency(i.unitCost)}</td><td>${currency(num(i.qty) * num(i.unitCost))}</td></tr>`).join('')}</table><div class="right total">VALOR TOTAL: ${currency(total(order))}</div><p>${order.notes || ''}</p></body></html>`);
    w.document.close(); w.print();
  };

  const filtered = useMemo(() => purchases.filter(p => {
    const text = `${p.number} ${p.supplier} ${p.requester} ${(p.items || []).map(i => i.description).join(' ')}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'Todos' || p.status === statusFilter);
  }), [purchases, query, statusFilter]);

  const counters = useMemo(() => ({
    total: purchases.length,
    pending: purchases.filter(p => p.status === 'Pendente de aprovação').length,
    open: purchases.filter(p => ['Aprovado', 'Pedido enviado', 'Recebido parcialmente'].includes(p.status)).length,
    value: purchases.filter(p => !['Cancelado', 'Recusado'].includes(p.status)).reduce((a, p) => a + total(p), 0)
  }), [purchases]);

  const setItem = (idx, key, value) => setEdit(cur => ({ ...cur, items: cur.items.map((i, n) => n === idx ? { ...i, [key]: value } : i) }));
  const selectProduct = (idx, id) => {
    const product = stock.find(s => s.id === id);
    setEdit(cur => ({ ...cur, items: cur.items.map((i, n) => n === idx ? { ...i, productId: id, description: product?.name || i.description, unitCost: product?.avgCost || product?.unitCost || i.unitCost } : i) }));
  };

  return <>
    <PageHeader title="Ordens de Compra" subtitle="Solicitação, aprovação, histórico, PDF e recebimento integrado ao estoque" actions={<button className="btn-primary" onClick={() => setEdit(emptyOrder(suppliers[0]?.name || ''))}><Plus size={18}/>Nova ordem</button>} />

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="card"><p className="text-xs uppercase text-brand-steel">Total de ordens</p><b className="text-2xl">{counters.total}</b></div>
      <div className="card"><p className="text-xs uppercase text-brand-steel">Aguardando aprovação</p><b className="text-2xl">{counters.pending}</b></div>
      <div className="card"><p className="text-xs uppercase text-brand-steel">Em andamento</p><b className="text-2xl">{counters.open}</b></div>
      <div className="card"><p className="text-xs uppercase text-brand-steel">Valor das compras</p><b className="text-2xl">{currency(counters.value)}</b></div>
    </div>

    <div className="card mb-5 flex flex-col gap-3 md:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-3" size={17}/><input className="input pl-10" placeholder="Buscar pedido, fornecedor, solicitante ou produto" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <select className="input md:w-64" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>Todos</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>
    </div>

    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[980px]"><thead><tr><th>Ordem</th><th>Fornecedor</th><th>Solicitante</th><th>Data</th><th>Entrega</th><th>Status</th><th>Recebimento</th><th>Valor</th><th>Ações</th></tr></thead>
      <tbody>{filtered.length === 0 ? <tr><td colSpan="9" className="py-10 text-center text-brand-steel">Nenhuma ordem de compra encontrada.</td></tr> : filtered.map(p => <tr key={p.id}>
        <td><button className="font-semibold text-brand-red hover:underline" onClick={() => setView(p)}>{p.number}</button></td>
        <td>{p.supplier}</td><td>{p.requester || '-'}</td><td>{p.requestDate || '-'}</td><td>{p.deliveryDate || '-'}</td>
        <td><span className={`badge ${statusClass(p.status)}`}>{p.status}</span></td>
        <td>{receivedTotal(p)}/{orderedTotal(p)}</td><td className="font-semibold">{currency(total(p))}</td>
        <td><div className="flex gap-1"><button className="btn-ghost p-2" title="Editar" onClick={() => setEdit(p)}><ClipboardCheck size={16}/></button><button className="btn-ghost p-2" title="PDF" onClick={() => pdf(p)}><FileDown size={16}/></button><button className="btn-ghost p-2" title="Receber" disabled={p.status === 'Recebido' || ['Cancelado','Recusado'].includes(p.status)} onClick={() => startReceipt(p)}><PackageCheck size={16}/></button></div></td>
      </tr>)}</tbody></table>
    </div>

    <Modal open={!!edit} title={edit?.id ? `Editar ${edit.number}` : 'Nova ordem de compra'} onClose={() => setEdit(null)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label><span className="mb-1 block text-sm font-semibold">Fornecedor</span><input className="input" list="purchase-suppliers" value={edit?.supplier || ''} onChange={e => setEdit({ ...edit, supplier: e.target.value })}/><datalist id="purchase-suppliers">{suppliers.map(s => <option key={s.id} value={s.name}/>)}</datalist></label>
        <label><span className="mb-1 block text-sm font-semibold">Solicitante</span><input className="input" value={edit?.requester || ''} onChange={e => setEdit({ ...edit, requester: e.target.value })}/></label>
        <label><span className="mb-1 block text-sm font-semibold">Setor</span><input className="input" value={edit?.department || ''} onChange={e => setEdit({ ...edit, department: e.target.value })}/></label>
        <label><span className="mb-1 block text-sm font-semibold">Data da solicitação</span><input className="input" type="date" value={edit?.requestDate || ''} onChange={e => setEdit({ ...edit, requestDate: e.target.value })}/></label>
        <label><span className="mb-1 block text-sm font-semibold">Previsão de entrega</span><input className="input" type="date" value={edit?.deliveryDate || ''} onChange={e => setEdit({ ...edit, deliveryDate: e.target.value })}/></label>
        <label><span className="mb-1 block text-sm font-semibold">Status</span><select className="input" value={edit?.status || ''} onChange={e => setEdit({ ...edit, status: e.target.value })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">Condição de pagamento</span><input className="input" value={edit?.paymentTerms || ''} onChange={e => setEdit({ ...edit, paymentTerms: e.target.value })}/></label>
      </div>

      <div className="mt-5 border border-brand-line p-4 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between"><div><b>Itens da ordem</b><p className="text-xs text-brand-steel">Selecione um item do estoque ou informe um produto/serviço livre.</p></div><button className="btn-ghost" onClick={() => setEdit({ ...edit, items: [...edit.items, emptyItem()] })}><Plus size={16}/>Adicionar item</button></div>
        <div className="space-y-3">{edit?.items?.map((item, idx) => <div key={idx} className="grid gap-2 border-b border-brand-line pb-3 dark:border-white/10 lg:grid-cols-[220px_1fr_100px_140px_46px]">
          <select className="input" value={item.productId || ''} onChange={e => selectProduct(idx, e.target.value)}><option value="">Produto livre</option>{stock.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <input className="input" placeholder="Descrição" value={item.description || ''} onChange={e => setItem(idx, 'description', e.target.value)}/>
          <input className="input" type="number" min="0" step="0.01" placeholder="Qtd." value={item.qty} onChange={e => setItem(idx, 'qty', e.target.value)}/>
          <input className="input" type="number" min="0" step="0.01" placeholder="Valor unit." value={item.unitCost} onChange={e => setItem(idx, 'unitCost', e.target.value)}/>
          <button className="btn-ghost p-2" disabled={edit.items.length === 1} onClick={() => setEdit({ ...edit, items: edit.items.filter((_, n) => n !== idx) })}><Trash2 size={16}/></button>
        </div>)}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label><span className="mb-1 block text-sm font-semibold">Observações</span><textarea className="input min-h-28" value={edit?.notes || ''} onChange={e => setEdit({ ...edit, notes: e.target.value })}/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-sm font-semibold">Frete</span><input className="input" type="number" value={edit?.freight || 0} onChange={e => setEdit({ ...edit, freight: e.target.value })}/></label>
          <label><span className="mb-1 block text-sm font-semibold">Desconto</span><input className="input" type="number" value={edit?.discount || 0} onChange={e => setEdit({ ...edit, discount: e.target.value })}/></label>
          <div className="sm:col-span-2 border border-brand-line p-4 text-right dark:border-white/10"><p>Subtotal: {currency(subtotal(edit || {}))}</p><p>Frete: {currency(edit?.freight)}</p><p>Desconto: {currency(edit?.discount)}</p><b className="text-xl">TOTAL: {currency(total(edit || {}))}</b></div>
        </div>
      </div>

      <div className="mt-5 border border-brand-line p-4 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>Comprovantes e anexos</b><p className="text-xs text-brand-steel">Registra os nomes dos arquivos para o histórico da ordem.</p></div><button className="btn-ghost" onClick={() => fileRef.current?.click()}><Paperclip size={16}/>Adicionar arquivo</button><input ref={fileRef} hidden multiple type="file" onChange={e => onFiles(e.target.files)}/></div><div className="mt-3 flex flex-wrap gap-2">{(edit?.attachments || []).map(a => <span key={a.id} className="border border-brand-line px-3 py-2 text-xs dark:border-white/10">{a.name} <button className="ml-2" onClick={() => setEdit({ ...edit, attachments: edit.attachments.filter(x => x.id !== a.id) })}>×</button></span>)}{!(edit?.attachments || []).length && <span className="text-sm text-brand-steel">Nenhum anexo.</span>}</div></div>

      <div className="mt-5 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancelar</button><button className="btn-primary" onClick={save}><CheckCircle2 size={17}/>Salvar ordem</button></div>
    </Modal>

    <Modal open={!!view} title={view?.number || 'Detalhes'} onClose={() => setView(null)}>
      {view && <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3"><div className="card"><small>Fornecedor</small><p className="font-semibold">{view.supplier}</p></div><div className="card"><small>Status</small><p><span className={`badge mt-1 ${statusClass(view.status)}`}>{view.status}</span></p></div><div className="card"><small>Valor total</small><p className="text-xl font-semibold">{currency(total(view))}</p></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th>Item</th><th>Qtd.</th><th>Recebido</th><th>Unitário</th><th>Total</th></tr></thead><tbody>{view.items.map((i, idx) => <tr key={idx}><td>{i.description}</td><td>{i.qty}</td><td>{i.receivedQty || 0}</td><td>{currency(i.unitCost)}</td><td>{currency(num(i.qty) * num(i.unitCost))}</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap gap-2"><button className="btn-ghost" onClick={() => print(view)}><Printer size={16}/>Imprimir</button><button className="btn-ghost" onClick={() => pdf(view)}><FileDown size={16}/>Baixar PDF</button><button className="btn-ghost" onClick={() => duplicate(view)}><Copy size={16}/>Duplicar</button>{view.status === 'Pendente de aprovação' && <><button className="btn-primary" onClick={() => updateStatus(view, 'Aprovado', 'Ordem aprovada')}><CheckCircle2 size={16}/>Aprovar</button><button className="btn-danger" onClick={() => updateStatus(view, 'Recusado', 'Ordem recusada')}><XCircle size={16}/>Recusar</button></>}{['Rascunho'].includes(view.status) && <button className="btn-primary" onClick={() => updateStatus(view, 'Pendente de aprovação', 'Enviado para aprovação')}><ClipboardCheck size={16}/>Enviar para aprovação</button>}<button className="btn-danger ml-auto" onClick={() => remove(view)}><Trash2 size={16}/>Excluir</button></div>
        <div className="border border-brand-line p-4 dark:border-white/10"><div className="mb-3 flex items-center gap-2"><History size={17}/><b>Histórico</b></div><div className="space-y-2">{(view.history || []).map(h => <div key={h.id} className="border-l-2 border-brand-red pl-3 text-sm"><b>{h.action}</b><div className="text-xs text-brand-steel">{new Date(h.date).toLocaleString('pt-BR')} • {h.user}</div></div>)}{!(view.history || []).length && <p className="text-sm text-brand-steel">Sem histórico registrado.</p>}</div></div>
      </div>}
    </Modal>

    <Modal open={!!receive} title={`Receber ${receive?.number || ''}`} onClose={() => setReceive(null)}>
      {receive && <><p className="mb-4 text-sm text-brand-steel">Informe somente o que chegou agora. Os itens vinculados ao estoque terão entrada automática.</p><div className="space-y-3">{receive.receiptItems.map((i, idx) => <div key={idx} className="grid gap-2 border-b border-brand-line pb-3 md:grid-cols-[1fr_110px_110px_140px]"><div><b>{i.description}</b><p className="text-xs text-brand-steel">{i.productId ? 'Vinculado ao estoque' : 'Item livre — sem movimentação automática'}</p></div><div><small>Pedido</small><p>{i.qty}</p></div><div><small>Já recebido</small><p>{i.receivedQty || 0}</p></div><label><small>Receber agora</small><input className="input" type="number" min="0" max={Math.max(0, num(i.qty) - num(i.receivedQty))} value={i.receiveNow} onChange={e => setReceive(cur => ({ ...cur, receiptItems: cur.receiptItems.map((x, n) => n === idx ? { ...x, receiveNow: e.target.value } : x) }))}/></label></div>)}</div><div className="mt-5 flex justify-end gap-3"><button className="btn-ghost" onClick={() => setReceive(null)}>Cancelar</button><button className="btn-primary" onClick={confirmReceipt}><PackageCheck size={17}/>Confirmar recebimento</button></div></>}
    </Modal>
  </>;
}
