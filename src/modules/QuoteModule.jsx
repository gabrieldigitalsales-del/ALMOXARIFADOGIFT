import React, { useEffect, useMemo, useState } from 'react';
import { deleteModuleRow, loadModuleRows, moduleTables, saveModuleRow } from '../services/moduleDataService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Archive, Calculator, Copy, Download, FilePlus2, History, Plus, Printer,
  Save, Search, Settings, Trash2, X
} from 'lucide-react';

const STORAGE_KEY = 'gift_orcamentos_v1';
const COMPANY_KEY = 'gift_empresa_v1';
const COUNTER_KEY = 'gift_orcamento_daily_counter_v2';

const initialCompany = {
  legalName: 'GIFT EXCELLENCE COMERCIO E MANUTENCAO LTDA',
  tradeName: 'GIFT EXCELLENCE',
  cnpj: '48.969.022/0001-90',
  stateRegistration: '004508789.00-16',
  address: 'RUA GERALDINO FIGUEIREDO, N° 373',
  district: 'BREJAO',
  cityState: 'SETE LAGOAS/MG',
  zipCode: '35701-590',
  phone: '(31) 3772-6397',
  whatsapp: '(31) 3772-6397',
  email: 'giftexcellence.03@gmail.com',
  website: 'https://www.giftexcellence.com.br',
  instagram: '@giftexcellence_ofc',
};

const emptyClient = {
  name: '', document: '', address: '', phone: '', email: '', contact: ''
};

const emptyItem = () => ({
  id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, deadline: ''
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const datePrefix = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};
const newLocalQuoteNumber = () => {
  const prefix = datePrefix();
  const stored = JSON.parse(localStorage.getItem(COUNTER_KEY) || '{}');
  const next = stored.date === prefix ? Number(stored.last || 0) + 1 : 1;
  localStorage.setItem(COUNTER_KEY, JSON.stringify({ date: prefix, last: next }));
  return `${prefix}${next}`;
};
const requestQuoteNumber = async () => newLocalQuoteNumber();

const initialQuote = () => ({
  id: crypto.randomUUID(),
  number: newLocalQuoteNumber(),
  date: todayISO(),
  validityDays: 15,
  client: { ...emptyClient },
  items: [emptyItem()],
  discount: 0,
  freight: 0,
  paymentTerms: '',
  deliveryTerms: '',
  guarantee: '6 meses',
  responsible: '',
  notes: '',
  status: 'Rascunho',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brDate = (iso) => iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '';
const safeNumber = (value) => Number(String(value).replace(',', '.')) || 0;

export default function QuoteModule() {
  const [company, setCompany] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null') || {};
    return { ...initialCompany, ...saved, district: String(saved.district || initialCompany.district).toUpperCase() };
  });
  const [quote, setQuote] = useState(initialQuote);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('editor');
  const [search, setSearch] = useState('');
  const [showCompany, setShowCompany] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem(COMPANY_KEY, JSON.stringify(company)), [company]);
  useEffect(() => {
    let active = true;
    loadModuleRows(moduleTables.quotes)
      .then(rows => { if (active) setHistory(rows); })
      .catch(error => notify(`Erro ao carregar histórico: ${error.message}`));
    return () => { active = false; };
  }, []);


  const subtotal = useMemo(() => quote.items.reduce((sum, item) => sum + safeNumber(item.quantity) * safeNumber(item.unitPrice), 0), [quote.items]);
  const total = Math.max(0, subtotal - safeNumber(quote.discount) + safeNumber(quote.freight));

  const validityDate = useMemo(() => {
    if (!quote.date) return '';
    const date = new Date(`${quote.date}T12:00:00`);
    date.setDate(date.getDate() + safeNumber(quote.validityDays));
    return date.toLocaleDateString('pt-BR');
  }, [quote.date, quote.validityDays]);

  const notify = (text) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2400);
  };

  const updateClient = (field, value) => setQuote(q => ({ ...q, client: { ...q.client, [field]: value } }));
  const updateItem = (id, field, value) => setQuote(q => ({ ...q, items: q.items.map(i => i.id === id ? { ...i, [field]: value } : i) }));
  const addItem = () => setQuote(q => ({ ...q, items: [...q.items, emptyItem()] }));
  const removeItem = (id) => setQuote(q => ({ ...q, items: q.items.length === 1 ? q.items : q.items.filter(i => i.id !== id) }));

  const saveQuote = async () => {
    if (!quote.client.name.trim()) return notify('Informe o nome do cliente.');
    if (!quote.items.some(i => i.description.trim())) return notify('Adicione pelo menos um item.');
    const saved = { ...quote, updatedAt: new Date().toISOString(), subtotal, total };

    try {
      const persisted = await saveModuleRow(moduleTables.quotes, saved);
      setHistory(list => [persisted, ...list.filter(i => i.id !== persisted.id)]);
      setQuote(persisted);
      notify('Orçamento salvo no Supabase.');
    } catch (error) {
      notify(`Erro ao salvar: ${error.message}`);
    }
  };

  const newQuote = async () => {
    const next = initialQuote();
    next.number = await requestQuoteNumber();
    setQuote(next);
    setTab('editor');
  };

  const loadQuote = (item) => {
    setQuote({ ...item, items: item.items.map(i => ({ ...i, id: i.id || crypto.randomUUID() })) });
    setTab('editor');
  };

  const duplicateQuote = async (item = quote) => {
    const nextNumber = await requestQuoteNumber();
    setQuote({
      ...item,
      id: crypto.randomUUID(),
      number: nextNumber,
      date: todayISO(),
      status: 'Rascunho',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: item.items.map(i => ({ ...i, id: crypto.randomUUID() })),
    });
    setTab('editor');
    notify('Orçamento duplicado.');
  };

  const deleteHistory = async (id) => {
    if (!confirm('Excluir este orçamento do histórico?')) return;
    try {
      await deleteModuleRow(moduleTables.quotes, id);
      setHistory(list => list.filter(i => i.id !== id));
      notify('Orçamento excluído.');
    } catch (error) {
      notify(`Erro ao excluir: ${error.message}`);
    }
  };

  const generatePdf = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    try {
      const img = await fetch('/logo-gift.png').then(r => r.blob()).then(blob => new Promise((resolve) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob);
      }));
      doc.addImage(img, 'PNG', margin, 8, 50, 30.13);
    } catch (_) {}

    doc.setFillColor(185, 28, 28);
    doc.rect(pageW - 63, 0, 63, 42, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(19);
    doc.text('ORÇAMENTO', pageW - 58, 18);
    doc.setFontSize(11);
    doc.text(`Nº ${quote.number}`, pageW - 58, 27);
    doc.setFont('helvetica','normal');
    doc.text(`Emissão: ${brDate(quote.date)}`, pageW - 58, 34);

    doc.setTextColor(40,40,40);
    doc.setFontSize(9);
    doc.setFont('helvetica','bold');
    doc.text(company.legalName || company.tradeName || 'GIFT EXCELLENCE', margin, 43);
    doc.setFont('helvetica','normal');
    const companyLines = [
      [company.tradeName, company.cnpj && `CNPJ: ${company.cnpj}`, company.stateRegistration && `IE: ${company.stateRegistration}`].filter(Boolean).join('  |  '),
      [company.address, company.district, company.cityState, company.zipCode && `CEP: ${company.zipCode}`].filter(Boolean).join(' - '),
      [company.phone && `Tel.: ${company.phone}`, company.whatsapp && `WhatsApp: ${company.whatsapp}`, company.email].filter(Boolean).join('  |  ')
    ].filter(Boolean);
    companyLines.forEach((line, idx) => doc.text(line, margin, 48 + idx * 4.5));

    let y = 70;
    doc.setDrawColor(225,225,225);
    doc.setFillColor(248,248,248);
    doc.roundedRect(margin, y, pageW - margin*2, 33, 2, 2, 'FD');
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(185,28,28);
    doc.text('DADOS DO CLIENTE', margin + 5, y + 8);
    doc.setTextColor(45,45,45);
    doc.setFontSize(9);
    doc.setFont('helvetica','normal');
    const left = [
      `Nome/Razão Social: ${quote.client.name || '-'}`,
      `Endereço: ${quote.client.address || '-'}`,
      `E-mail: ${quote.client.email || '-'}`,
    ];
    const right = [
      `CPF/CNPJ: ${quote.client.document || '-'}`,
      `Telefone: ${quote.client.phone || '-'}`,
      `Contato: ${quote.client.contact || '-'}`,
    ];
    left.forEach((t,i)=>doc.text(t, margin+5, y+15+i*6));
    right.forEach((t,i)=>doc.text(t, 112, y+15+i*6));

    autoTable(doc, {
      startY: y + 40,
      margin: { left: margin, right: margin },
      head: [['Item', 'Descrição', 'Qtd.', 'Vlr. Unit.', 'Subtotal', 'Prazo']],
      body: quote.items.filter(i => i.description.trim()).map((i, idx) => [
        idx+1, i.description, String(i.quantity), money.format(safeNumber(i.unitPrice)),
        money.format(safeNumber(i.quantity)*safeNumber(i.unitPrice)), i.deadline || '-'
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, lineColor: [225,225,225], lineWidth: 0.2 },
      headStyles: { fillColor: [185,28,28], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 74 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 29, halign: 'right' },
        5: { cellWidth: 25, halign: 'center' },
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    const boxX = 120;
    doc.setFillColor(248,248,248);
    doc.roundedRect(boxX, y, pageW-margin-boxX, 30, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(70,70,70);
    doc.text('Subtotal:', boxX+5, y+7);
    doc.text('Desconto:', boxX+5, y+14);
    doc.text('Frete:', boxX+5, y+21);
    doc.setFont('helvetica','bold');
    doc.setTextColor(185,28,28);
    doc.text('TOTAL:', boxX+5, y+28);
    doc.setTextColor(45,45,45);
    doc.text(money.format(subtotal), pageW-margin-4, y+7, { align:'right' });
    doc.text(money.format(safeNumber(quote.discount)), pageW-margin-4, y+14, { align:'right' });
    doc.text(money.format(safeNumber(quote.freight)), pageW-margin-4, y+21, { align:'right' });
    doc.setTextColor(185,28,28);
    doc.setFontSize(11);
    doc.text(money.format(total), pageW-margin-4, y+28, { align:'right' });

    y += 39;
    doc.setFontSize(9);
    doc.setTextColor(45,45,45);
    const details = [
      ['Validade da proposta', `${quote.validityDays} dias — até ${validityDate}`],
      ['Condição de pagamento', quote.paymentTerms || 'A combinar'],
      ['Prazo/forma de entrega', quote.deliveryTerms || 'A combinar'],
      ['Garantia', quote.guarantee || '6 meses'],
      ['Responsável', quote.responsible || 'Não informado'],
    ];
    details.forEach(([label, value]) => {
      doc.setFont('helvetica','bold'); doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica','normal'); doc.text(value, 57, y);
      y += 6;
    });

    if (quote.notes.trim()) {
      y += 3;
      doc.setFont('helvetica','bold'); doc.setTextColor(185,28,28); doc.text('OBSERVAÇÕES', margin, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(45,45,45);
      const lines = doc.splitTextToSize(quote.notes, pageW-margin*2);
      doc.text(lines, margin, y+6);
    }

    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220,220,220); doc.line(margin, pageH-18, pageW-margin, pageH-18);
    doc.setFontSize(8); doc.setTextColor(110,110,110);
    const footerY = pageH - 11;
    let footerX = margin;
    doc.text('GIFT EXCELLENCE  •  ', footerX, footerY);
    footerX += doc.getTextWidth('GIFT EXCELLENCE  •  ');
    if (company.website) {
      doc.setTextColor(185,28,28);
      doc.textWithLink(company.website.replace(/^https?:\/\//, ''), footerX, footerY, { url: company.website });
      footerX += doc.getTextWidth(company.website.replace(/^https?:\/\//, '')) + 4;
    }
    if (company.instagram) {
      const instagramHandle = company.instagram.replace(/^@/, '');
      doc.setTextColor(185,28,28);
      doc.textWithLink(`@${instagramHandle}`, footerX, footerY, { url: `https://www.instagram.com/${instagramHandle}/` });
    }
    doc.setTextColor(110,110,110);
    doc.text(`Orçamento ${quote.number}`, pageW-margin, footerY, { align:'right' });

    doc.save(`Orcamento_GIFT_${quote.number}.pdf`);
    notify('PDF gerado.');
  };

  const filtered = history.filter(item => {
    const text = `${item.number} ${item.client?.name || ''} ${item.client?.document || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="gift-quote-module"><div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logo-gift.png" alt="GIFT Excellence" /></div>
        <nav>
          <button className={tab==='editor'?'active':''} onClick={()=>setTab('editor')}><Calculator size={19}/>Novo orçamento</button>
          <button className={tab==='history'?'active':''} onClick={()=>setTab('history')}><History size={19}/>Histórico <span>{history.length}</span></button>
          <button onClick={()=>setShowCompany(true)}><Settings size={19}/>Dados da empresa</button>
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">GIFT EXCELLENCE</p>
            <h1>{tab === 'editor' ? 'Emissor de Orçamentos' : 'Histórico de Orçamentos'}</h1>
          </div>
          {tab === 'editor' && <div className="top-actions">
            <button className="btn ghost" onClick={newQuote}><FilePlus2 size={18}/>Novo</button>
            <button className="btn ghost" onClick={()=>duplicateQuote()}><Copy size={18}/>Duplicar</button>
            <button className="btn primary" onClick={saveQuote}><Save size={18}/>Salvar</button>
          </div>}
        </header>

        {tab === 'editor' ? (
          <section className="workspace">
            <div className="form-column">
              <div className="card heading-card">
                <div className="field grow"><label>Número do orçamento</label><input value={quote.number} onChange={e=>setQuote({...quote, number:e.target.value})}/></div>
                <div className="field"><label>Data de emissão</label><input type="date" value={quote.date} onChange={e=>setQuote({...quote, date:e.target.value})}/></div>
                <div className="field small"><label>Validade (dias)</label><input type="number" min="1" value={quote.validityDays} onChange={e=>setQuote({...quote, validityDays:e.target.value})}/></div>
                <div className="field small"><label>Status</label><select value={quote.status} onChange={e=>setQuote({...quote, status:e.target.value})}><option>Rascunho</option><option>Enviado</option><option>Aprovado</option><option>Recusado</option></select></div>
              </div>

              <div className="card">
                <div className="section-title"><div><span>01</span><h2>Dados do cliente</h2></div></div>
                <div className="grid two">
                  <div className="field"><label>Nome / Razão Social *</label><input value={quote.client.name} onChange={e=>updateClient('name',e.target.value)} /></div>
                  <div className="field"><label>CPF / CNPJ</label><input value={quote.client.document} onChange={e=>updateClient('document',e.target.value)} /></div>
                  <div className="field"><label>Endereço</label><input value={quote.client.address} onChange={e=>updateClient('address',e.target.value)} /></div>
                  <div className="field"><label>Telefone</label><input value={quote.client.phone} onChange={e=>updateClient('phone',e.target.value)} /></div>
                  <div className="field"><label>E-mail</label><input type="email" value={quote.client.email} onChange={e=>updateClient('email',e.target.value)} /></div>
                  <div className="field"><label>Contato</label><input value={quote.client.contact} onChange={e=>updateClient('contact',e.target.value)} /></div>
                </div>
              </div>

              <div className="card">
                <div className="section-title"><div><span>02</span><h2>Produtos e serviços</h2></div><button className="btn soft" onClick={addItem}><Plus size={17}/>Adicionar item</button></div>
                <div className="items-table">
                  <div className="items-head"><span>Descrição</span><span>Qtd.</span><span>Valor unit.</span><span>Prazo</span><span>Subtotal</span><span></span></div>
                  {quote.items.map(item => <div className="item-row" key={item.id}>
                    <input placeholder="Produto ou serviço" value={item.description} onChange={e=>updateItem(item.id,'description',e.target.value)} />
                    <input type="number" min="0" step="0.01" value={item.quantity} onChange={e=>updateItem(item.id,'quantity',e.target.value)} />
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updateItem(item.id,'unitPrice',e.target.value)} />
                    <input placeholder="Ex.: 15 dias" value={item.deadline} onChange={e=>updateItem(item.id,'deadline',e.target.value)} />
                    <strong>{money.format(safeNumber(item.quantity)*safeNumber(item.unitPrice))}</strong>
                    <button className="icon danger" title="Excluir" onClick={()=>removeItem(item.id)}><Trash2 size={17}/></button>
                  </div>)}
                </div>
              </div>

              <div className="card">
                <div className="section-title"><div><span>03</span><h2>Condições comerciais</h2></div></div>
                <div className="grid two">
                  <div className="field"><label>Condição de pagamento</label><input placeholder="Ex.: 50% entrada + 50% na entrega" value={quote.paymentTerms} onChange={e=>setQuote({...quote,paymentTerms:e.target.value})}/></div>
                  <div className="field"><label>Prazo / forma de entrega</label><input placeholder="Ex.: FOB, retirada ou transportadora" value={quote.deliveryTerms} onChange={e=>setQuote({...quote,deliveryTerms:e.target.value})}/></div>
                  <div className="field"><label>Desconto (R$)</label><input type="number" min="0" step="0.01" value={quote.discount} onChange={e=>setQuote({...quote,discount:e.target.value})}/></div>
                  <div className="field"><label>Frete (R$)</label><input type="number" min="0" step="0.01" value={quote.freight} onChange={e=>setQuote({...quote,freight:e.target.value})}/></div>
                  <div className="field"><label>Garantia</label><input placeholder="Ex.: 6 meses" value={quote.guarantee || ''} onChange={e=>setQuote({...quote,guarantee:e.target.value})}/></div>
                  <div className="field"><label>Responsável pelo orçamento</label><input placeholder="Nome do responsável" value={quote.responsible || ''} onChange={e=>setQuote({...quote,responsible:e.target.value})}/></div>
                  <div className="field full"><label>Observações</label><textarea rows="5" placeholder="Especificações, condições e outras informações..." value={quote.notes} onChange={e=>setQuote({...quote,notes:e.target.value})}/></div>
                </div>
              </div>
            </div>

            <aside className="summary-column">
              <div className="summary-card">
                <p>RESUMO DO ORÇAMENTO</p>
                <div><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div>
                <div><span>Desconto</span><strong>- {money.format(safeNumber(quote.discount))}</strong></div>
                <div><span>Frete</span><strong>{money.format(safeNumber(quote.freight))}</strong></div>
                <div className="total"><span>Total</span><strong>{money.format(total)}</strong></div>
                <small>Proposta válida até {validityDate || '--/--/----'}</small>
                <button className="btn primary wide" onClick={generatePdf}><Download size={18}/>Gerar PDF</button>
                <button className="btn ghost wide" onClick={()=>window.print()}><Printer size={18}/>Imprimir tela</button>
              </div>
            </aside>
          </section>
        ) : (
          <section className="history-page">
            <div className="history-tools"><div className="search"><Search size={18}/><input placeholder="Buscar por número, cliente ou documento" value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="btn primary" onClick={newQuote}><Plus size={18}/>Novo orçamento</button></div>
            <div className="history-list">
              {filtered.length === 0 ? <div className="empty"><Archive size={42}/><h3>Nenhum orçamento encontrado</h3><p>Os orçamentos salvos aparecerão aqui.</p></div> : filtered.map(item => <article className="history-card" key={item.id}>
                <div className="history-main"><span className={`status ${item.status?.toLowerCase()}`}>{item.status}</span><h3>{item.client?.name || 'Cliente não informado'}</h3><p>Orçamento nº {item.number} • {brDate(item.date)}</p></div>
                <div className="history-total"><small>Total</small><strong>{money.format(item.total ?? 0)}</strong></div>
                <div className="history-actions"><button className="btn soft" onClick={()=>loadQuote(item)}>Abrir</button><button className="icon" title="Duplicar" onClick={()=>duplicateQuote(item)}><Copy size={18}/></button><button className="icon danger" title="Excluir" onClick={()=>deleteHistory(item.id)}><Trash2 size={18}/></button></div>
              </article>)}
            </div>
          </section>
        )}
      </main>

      {showCompany && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><p className="eyebrow">CONFIGURAÇÃO</p><h2>Dados da empresa</h2></div><button className="icon" onClick={()=>setShowCompany(false)}><X/></button></div><div className="grid two">
        <div className="field full"><label>Razão social</label><input value={company.legalName || ''} onChange={e=>setCompany({...company,legalName:e.target.value})}/></div>
        <div className="field"><label>Nome fantasia</label><input value={company.tradeName || ''} onChange={e=>setCompany({...company,tradeName:e.target.value})}/></div>
        <div className="field"><label>CNPJ</label><input value={company.cnpj || ''} onChange={e=>setCompany({...company,cnpj:e.target.value})}/></div>
        <div className="field"><label>Inscrição Estadual</label><input value={company.stateRegistration || ''} onChange={e=>setCompany({...company,stateRegistration:e.target.value})}/></div>
        <div className="field"><label>CEP</label><input value={company.zipCode || ''} onChange={e=>setCompany({...company,zipCode:e.target.value})}/></div>
        <div className="field full"><label>Endereço</label><input value={company.address || ''} onChange={e=>setCompany({...company,address:e.target.value})}/></div>
        <div className="field"><label>Bairro</label><input value={company.district || ''} onChange={e=>setCompany({...company,district:e.target.value.toUpperCase()})}/></div>
        <div className="field"><label>Cidade / UF</label><input value={company.cityState || ''} onChange={e=>setCompany({...company,cityState:e.target.value})}/></div>
        <div className="field"><label>Telefone</label><input value={company.phone || ''} onChange={e=>setCompany({...company,phone:e.target.value})}/></div>
        <div className="field"><label>WhatsApp</label><input value={company.whatsapp || ''} onChange={e=>setCompany({...company,whatsapp:e.target.value})}/></div>
        <div className="field full"><label>E-mail</label><input value={company.email || ''} onChange={e=>setCompany({...company,email:e.target.value})}/></div>
        <div className="field"><label>Site</label><input value={company.website || ''} onChange={e=>setCompany({...company,website:e.target.value})}/></div>
        <div className="field"><label>Instagram</label><input value={company.instagram || ''} onChange={e=>setCompany({...company,instagram:e.target.value})}/></div>
      </div><div className="modal-actions"><button className="btn primary" onClick={()=>{setShowCompany(false);notify('Dados da empresa salvos.')}}><Save size={18}/>Salvar dados</button></div></div></div>}
      <footer className="app-footer"><a href={company.website} target="_blank" rel="noreferrer">{company.website?.replace(/^https?:\/\//, '')}</a><span>•</span><a href={`https://www.instagram.com/${company.instagram?.replace(/^@/, '')}/`} target="_blank" rel="noreferrer">{company.instagram}</a></footer>
      {toast && <div className="toast">{toast}</div>}
    </div></div>
  );
}

