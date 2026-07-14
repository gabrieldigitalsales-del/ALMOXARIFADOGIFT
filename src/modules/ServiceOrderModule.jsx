import React, { useEffect, useState } from 'react'
import { Printer, Save, RotateCcw, Plus, Trash2, Settings2, History, FilePlus2, Copy } from 'lucide-react'

const COMPANY = {
  address: 'Rua Geraldino Figueiredo, nº 373 - Brejão, Sete Lagoas - MG, 35701-590',
  site: 'www.giftexcellence.com.br',
  instagram: '@giftexcellence_ofc'
}

const PRESETS = {
  '20x15': { label: '20 × 15 cm — Bloco horizontal', width: 20, height: 15, className: 'compact landscape' },
  '15x20': { label: '15 × 20 cm — Bloco vertical', width: 15, height: 20, className: 'compact portrait' },
  'a4p': { label: 'A4 — Retrato', width: 21, height: 29.7, className: 'a4 portrait' },
  'a4l': { label: 'A4 — Paisagem', width: 29.7, height: 21, className: 'a4 landscape' },
  'a5p': { label: 'A5 — Retrato', width: 14.8, height: 21, className: 'compact portrait' },
  'custom': { label: 'Medida personalizada', width: 20, height: 15, className: 'compact landscape' }
}

const makeItems = rows => rows.map(([qty, description], index) => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
  qty,
  description,
  value: ''
}))

const FIRST_ITEMS = [
  ['2', 'Rolamentos flangeados'],
  ['1', 'Rolamento excêntrico'],
  ['2', 'Coifas — parte de cima'],
  ['2', 'Coifas — parte de baixo'],
  ['2', 'Hastes'],
  ['1', 'Trinco'],
  ['4', 'Pés de borracha'],
  ['1', 'Corte da calha de pó'],
  ['1', 'Lubrificação completa'],
  ['1', 'Mão de obra']
]

const SECOND_ITEMS = [
  ['2', 'Rolamentos flangeados'],
  ['2', 'Coifas — parte de cima'],
  ['2', 'Coifas — parte de baixo'],
  ['2', 'Hastes'],
  ['4', 'Pés de borracha'],
  ['1', 'Lubrificação completa'],
  ['1', 'Troca de motor'],
  ['1', 'Manutenção elétrica'],
  ['1', 'Troca de componentes elétricos'],
  ['35', 'Parafusos autobrocantes'],
  ['1', 'Mão de obra']
]

const DEFAULT_HISTORY = [
  {
    id: 'template-maquina-1',
    title: 'Revisão — Máquina de bater 1',
    createdAt: 'Modelo padrão',
    locked: true,
    items: FIRST_ITEMS
  },
  {
    id: 'template-maquina-2',
    title: 'Revisão — Máquina de bater 2',
    createdAt: 'Modelo padrão',
    locked: true,
    items: SECOND_ITEMS
  }
]

function generateOrderNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterKey = `gift-os-counter-${dateKey}`
  const next = Number(localStorage.getItem(counterKey) || '0') + 1
  localStorage.setItem(counterKey, String(next))
  return `OS-${dateKey}-${String(next).padStart(3, '0')}`
}

const createBlankOrder = (items = FIRST_ITEMS) => ({
  orderNumber: generateOrderNumber(),
  date: '',
  client: '',
  phone: '',
  equipment: 'Máquina de bater',
  identification: '',
  technician: '',
  notes: '',
  totalValue: '',
  items: makeItems(items)
})

export default function ServiceOrderModule() {
  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gift-os-v4'))
      return saved?.items?.length ? saved : createBlankOrder()
    } catch {
      return createBlankOrder()
    }
  })
  const [history, setHistory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gift-os-history-v1')) || []
      const custom = saved.filter(entry => !DEFAULT_HISTORY.some(item => item.id === entry.id))
      return [...DEFAULT_HISTORY, ...custom]
    } catch {
      return DEFAULT_HISTORY
    }
  })
  const [preset, setPreset] = useState(localStorage.getItem('gift-os-size') || '20x15')
  const [customWidth, setCustomWidth] = useState('20')
  const [customHeight, setCustomHeight] = useState('15')
  const [saved, setSaved] = useState(false)

  const size = preset === 'custom'
    ? {
        ...PRESETS.custom,
        width: Number(customWidth) || 20,
        height: Number(customHeight) || 15,
        className: (Number(customWidth) || 20) >= (Number(customHeight) || 15) ? 'compact landscape' : 'compact portrait'
      }
    : PRESETS[preset]

  useEffect(() => localStorage.setItem('gift-os-v4', JSON.stringify(data)), [data])
  useEffect(() => localStorage.setItem('gift-os-history-v1', JSON.stringify(history)), [history])

  useEffect(() => {
    localStorage.setItem('gift-os-size', preset)
    document.documentElement.style.setProperty('--page-width', `${size.width}cm`)
    document.documentElement.style.setProperty('--page-height', `${size.height}cm`)
    document.getElementById('dynamic-page-size')?.remove()
    const style = document.createElement('style')
    style.id = 'dynamic-page-size'
    style.textContent = `@media print { @page { size: ${size.width}cm ${size.height}cm; margin: 0; } }`
    document.head.appendChild(style)
  }, [preset, customWidth, customHeight, size.width, size.height])

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }))
  const updateItem = (id, field, value) => setData(prev => ({
    ...prev,
    items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
  }))

  const addItem = () => setData(prev => ({
    ...prev,
    items: [...prev.items, { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, qty: '', description: '', value: '' }]
  }))

  const removeItem = id => setData(prev => ({
    ...prev,
    items: prev.items.filter(item => item.id !== id)
  }))

  const save = () => {
    localStorage.setItem('gift-os-v4', JSON.stringify(data))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const newOrder = () => {
    if (window.confirm('Criar uma nova ordem de serviço?')) setData(createBlankOrder([]))
  }

  const reset = () => {
    if (window.confirm('Restaurar o primeiro modelo padrão?')) setData(createBlankOrder(FIRST_ITEMS))
  }

  const loadHistory = entry => {
    setData(createBlankOrder(entry.items.map(item => Array.isArray(item) ? item : [item.qty || '', item.description || ''])))
    window.scrollTo({ top: document.querySelector('.sheet')?.offsetTop || 0, behavior: 'smooth' })
  }

  const saveToHistory = () => {
    const title = window.prompt('Nome para salvar no histórico:', data.client ? `OS — ${data.client}` : `OS — ${data.orderNumber}`)
    if (!title?.trim()) return
    const entry = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      title: title.trim(),
      createdAt: new Date().toLocaleString('pt-BR'),
      locked: false,
      items: data.items.map(item => [item.qty, item.description])
    }
    setHistory(prev => [...prev, entry])
  }

  const deleteHistory = id => {
    if (window.confirm('Remover este item do histórico?')) setHistory(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="gift-os-module"><main>
      <section className="toolbar no-print">
        <div>
          <span className="eyebrow">GIFT EXCELLENCE</span>
          <h1>Gerador de Ordem de Serviço</h1>
          <p>Crie, edite, salve no histórico e imprima no tamanho desejado.</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="ghost" onClick={newOrder}><FilePlus2 size={17}/>Nova OS</button>
          <button type="button" className="ghost" onClick={reset}><RotateCcw size={17}/>Modelo 1</button>
          <button type="button" className="ghost" onClick={save}><Save size={17}/>{saved ? 'Salvo' : 'Salvar'}</button>
          <button type="button" className="ghost" onClick={saveToHistory}><History size={17}/>Salvar no histórico</button>
          <button type="button" className="primary" onClick={() => window.print()}><Printer size={17}/>Imprimir / PDF</button>
        </div>
      </section>

      <section className="print-settings no-print">
        <div className="settings-title"><Settings2 size={18}/><strong>Tamanho de impressão</strong></div>
        <select value={preset} onChange={e => setPreset(e.target.value)}>
          {Object.entries(PRESETS).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
        </select>
        {preset === 'custom' && <div className="custom-size">
          <label>Largura (cm)<input type="number" min="8" step="0.1" value={customWidth} onChange={e => setCustomWidth(e.target.value)}/></label>
          <span>×</span>
          <label>Altura (cm)<input type="number" min="8" step="0.1" value={customHeight} onChange={e => setCustomHeight(e.target.value)}/></label>
        </div>}
        <span className="size-badge">Prévia: {size.width} × {size.height} cm</span>
      </section>

      <section className="history-panel no-print">
        <div className="history-title"><History size={18}/><div><strong>Histórico e modelos salvos</strong><span>Os dois modelos pedidos já estão disponíveis.</span></div></div>
        <div className="history-grid">
          {history.map(entry => <article className="history-card" key={entry.id}>
            <div><strong>{entry.title}</strong><span>{entry.createdAt}</span><small>{entry.items.length} itens</small></div>
            <div className="history-actions">
              <button type="button" onClick={() => loadHistory(entry)}><Copy size={15}/>Usar</button>
              {!entry.locked && <button type="button" className="danger" onClick={() => deleteHistory(entry.id)}><Trash2 size={15}/></button>}
            </div>
          </article>)}
        </div>
      </section>

      <div className="preview-scroll">
        <article className={`sheet ${size.className} ${data.items.length > 10 ? 'dense' : ''}`} style={{ '--sheet-w': `${size.width}cm`, '--sheet-h': `${size.height}cm` }}>
          <header className="header">
            <img src="/logo-gift.png" alt="GIFT Excellence"/>
            <div className="title"><h2>ORDEM DE SERVIÇO</h2><span>Assistência Técnica / Revisão</span></div>
            <Field label="Nº O.S." value={data.orderNumber} onChange={v => update('orderNumber', v)} small />
          </header>

          <section className="meta">
            <Field label="Data" value={data.date} onChange={v => update('date', v)} placeholder="__/__/____" />
            <Field label="Cliente" value={data.client} onChange={v => update('client', v)} wide />
            <Field label="Telefone" value={data.phone} onChange={v => update('phone', v)} />
            <Field label="Equipamento" value={data.equipment} onChange={v => update('equipment', v)} />
            <Field label="Modelo / Identificação" value={data.identification} onChange={v => update('identification', v)} wide />
            <Field label="Técnico responsável" value={data.technician} onChange={v => update('technician', v)} />
          </section>

          <section className="items-title"><strong>PEÇAS E SERVIÇOS PRESTADOS</strong></section>

          <section className="items">
            <div className="items-head no-print"><strong>{data.items.length} itens</strong><button type="button" onClick={addItem}><Plus size={14}/>Adicionar item</button></div>
            <table>
              <thead><tr><th className="num">Item</th><th>Descrição</th><th className="qty">Qtd.</th><th className="value">Valor total</th><th className="delete no-print"></th></tr></thead>
              <tbody>{data.items.map((item, index) => <tr key={item.id}>
                <td className="index">{index + 1}</td>
                <td><input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></td>
                <td><input value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} /></td>
                <td><div className="money"><span>R$</span><input inputMode="decimal" value={item.value} onChange={e => updateItem(item.id, 'value', e.target.value)} /></div></td>
                <td className="no-print"><button type="button" className="trash" onClick={() => removeItem(item.id)} title="Remover item"><Trash2 size={14}/></button></td>
              </tr>)}</tbody>
            </table>
          </section>

          <section className="lower simple-lower">
            <label className="notes"><span>Observações</span><textarea value={data.notes} onChange={e => update('notes', e.target.value)}/></label>
            <div className="summary single-total"><label className="total-only"><span>VALOR TOTAL</span><div className="money blank-total"><span>R$</span><input inputMode="decimal" value={data.totalValue} onChange={e => update('totalValue', e.target.value)} /></div></label></div>
          </section>

          <section className="signature"><span></span><p>Assinatura do Cliente</p></section>

          <footer>
            <div><b>Endereço</b><span>{COMPANY.address}</span></div>
            <div><b>Site</b><span>{COMPANY.site}</span></div>
            <div><b>Instagram</b><span>{COMPANY.instagram}</span></div>
          </footer>
        </article>
      </div>
    </main></div>
  )
}

function Field({ label, value, onChange, type = 'text', wide = false, small = false, placeholder = '' }) {
  return <label className={`field ${wide ? 'wide' : ''} ${small ? 'small' : ''}`}><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></label>
}

