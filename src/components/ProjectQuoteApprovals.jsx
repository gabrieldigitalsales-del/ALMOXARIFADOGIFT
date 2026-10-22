import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { askConfirm, inform } from '../utils/appDialogs';
import { saveQuoteAttachment, readQuoteAttachment, deleteQuoteAttachment } from '../utils/localQuoteAttachments';

const KEY = 'gift.sandbox.projectApprovals.v1';
const empty = () => ({
  name: '',
  reference: '',
  product: '',
  quantity: '1',
  unit: 'un',
  supplier: '',
  notes: '',
  file: null,
});
const load = () => {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};
const number = (v) => {
  const s = String(v ?? '').trim().replace(/\s/g, '');
  return Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
};
const niceDate = (s) => {
  try {
    return new Date(s).toLocaleString('pt-BR');
  } catch {
    return '';
  }
};

export default function ProjectQuoteApprovals({ showForm = false }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [projects, setProjects] = useState(load);
  const [draft, setDraft] = useState(empty);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Não foi possível salvar as cotações avulsas', e);
    }
  }, [projects]);

  const patch = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const add = async () => {
    if (busy) return;
    if (!draft.product.trim()) return inform('Informe o produto ou serviço deste orçamento.');
    if (!draft.supplier.trim()) return inform('Informe o fornecedor.');
    const q = number(draft.quantity);
    if (!Number.isFinite(q) || q <= 0) return inform('Informe uma quantidade válida.');
    if (!draft.file) return inform('Anexe o orçamento em PDF ou imagem.');
    if (draft.file.size > 15 * 1024 * 1024) return inform('O anexo deve ter no máximo 15 MB.');

    setBusy(true);
    const id = crypto.randomUUID();
    try {
      await saveQuoteAttachment(id, draft.file);
      const record = {
        id,
        name: draft.name.trim() || draft.product.trim(),
        reference: draft.reference.trim(),
        product: draft.product.trim(),
        quantity: q,
        unit: draft.unit.trim() || 'un',
        supplier: draft.supplier.trim(),
        notes: draft.notes.trim(),
        fileName: draft.file.name,
        createdAt: new Date().toISOString(),
        status: 'Para aprovação',
        reviewedAt: null,
        lines: [],
      };
      setProjects((old) => [record, ...old]);
      setDraft(empty());
      setFileKey((x) => x + 1);
      setExpanded(null);
      setStatusFilter('all');
    } catch (err) {
      await deleteQuoteAttachment(id).catch(() => {});
      await inform('Falha ao salvar o anexo. O orçamento não foi adicionado: ' + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (project, status) => {
    if (project.status === status) return;
    const verb = status === 'Aprovado' ? 'Aprovar' : 'Recusar';
    if (!(await askConfirm(`${verb} o orçamento de ${project.supplier || 'fornecedor não informado'} para ${project.product || project.name}? Esta decisão não movimenta o estoque.`))) return;
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, status, reviewedAt: new Date().toISOString() } : p)));
  };

  const remove = async (project) => {
    if (!(await askConfirm(`Excluir o orçamento “${project.name || project.product}”? A exclusão também remove o anexo local.`))) return;
    setProjects((list) => list.filter((p) => p.id !== project.id));
    await deleteQuoteAttachment(project.id).catch((e) => console.error('Não foi possível excluir anexo', e));
  };

  const openAttachment = async (project) => {
    const file = await readQuoteAttachment(project.id);
    if (!file) return inform('Este anexo não está disponível neste navegador.');
    const href = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = href;
    a.download = file.name || project.fileName || 'orcamento';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 3000);
  };

  const exportAll = () => {
    if (!projects.length) return inform('Não existem cotações cadastradas para exportar.');
    const rows = [...projects]
      .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
      .flatMap((project) => {
        const base = {
          Produto: project.product || project.name || 'Orçamento avulso',
          Quantidade: project.quantity || '',
          Unidade: project.unit || 'un',
          Fornecedor: project.supplier || '',
          'Cotação / projeto': project.name || '',
          'Referência / máquina': project.reference || '',
          Status: project.status || 'Rascunho',
          Data: project.createdAt || '',
          'Data da decisão': project.reviewedAt || '',
          Arquivo: project.fileName || '',
          Observações: project.notes || '',
        };
        if (!project.lines?.length) return [base];
        return project.lines.map((line) => ({
          ...base,
          Produto: line.product || base.Produto,
          Quantidade: line.quantity || base.Quantidade,
          Unidade: line.unit || base.Unidade,
          Fornecedor: line.selectedSupplier >= 0 ? line.suppliers?.[line.selectedSupplier]?.name || base.Fornecedor : base.Fornecedor,
          'Fornecedor 1': line.suppliers?.[0]?.name || '',
          'Fornecedor 2': line.suppliers?.[1]?.name || '',
          'Fornecedor 3': line.suppliers?.[2]?.name || '',
        }));
      });

    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [
      { wch: 55 },
      { wch: 14 },
      { wch: 12 },
      { wch: 33 },
      { wch: 36 },
      { wch: 30 },
      { wch: 20 },
      { wch: 24 },
      { wch: 24 },
      { wch: 34 },
      { wch: 50 },
    ];
    sheet['!autofilter'] = { ref: sheet['!ref'] };
    XLSX.utils.book_append_sheet(book, sheet, 'Cotações acumuladas');
    XLSX.writeFile(book, 'gift-cotacoes-avulsas-historico.xlsx');
  };

  const counts = useMemo(
    () => ({
      all: projects.length,
      pending: projects.filter((p) => !['Aprovado', 'Reprovado'].includes(p.status)).length,
      approved: projects.filter((p) => p.status === 'Aprovado').length,
      rejected: projects.filter((p) => p.status === 'Reprovado').length,
    }),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    if (statusFilter === 'pending') return projects.filter((p) => !['Aprovado', 'Reprovado'].includes(p.status));
    if (statusFilter === 'approved') return projects.filter((p) => p.status === 'Aprovado');
    if (statusFilter === 'rejected') return projects.filter((p) => p.status === 'Reprovado');
    return projects;
  }, [projects, statusFilter]);

  const tabs = [
    ['all', `Todas (${counts.all})`],
    ['pending', `Para aprovação (${counts.pending})`],
    ['approved', `Aprovadas (${counts.approved})`],
    ['rejected', `Recusadas (${counts.rejected})`],
  ];

  const anchor = mounted && typeof document !== 'undefined' ? document.getElementById('gift-project-quote-form-anchor') : null;

  const form = (
    <div className="rounded-sm border border-brand-line bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
      <h3 className="mb-1 text-sm font-bold uppercase">Cotação avulsa por projeto</h3>
      <p className="mb-4 text-xs text-gray-500">Anexe um orçamento completo, sem selecionar produto do estoque. Após adicionar, ele ficará disponível na aba de aprovação direta.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold">Produto / serviço<input className="input mt-1" value={draft.product} onChange={(e) => patch('product', e.target.value)} /></label>
        <label className="text-xs font-semibold">Fornecedor<input className="input mt-1" value={draft.supplier} onChange={(e) => patch('supplier', e.target.value)} /></label>
        <label className="text-xs font-semibold">Quantidade<input className="input mt-1" inputMode="decimal" value={draft.quantity} onChange={(e) => patch('quantity', e.target.value)} /></label>
        <label className="text-xs font-semibold">Unidade<input className="input mt-1" value={draft.unit} onChange={(e) => patch('unit', e.target.value)} /></label>
        <label className="text-xs font-semibold">Projeto / nome da cotação (opcional)<input className="input mt-1" value={draft.name} onChange={(e) => patch('name', e.target.value)} /></label>
        <label className="text-xs font-semibold">Máquina / referência (opcional)<input className="input mt-1" value={draft.reference} onChange={(e) => patch('reference', e.target.value)} /></label>
      </div>
      <label className="mt-3 block text-xs font-semibold">Orçamento PDF ou imagem<input key={fileKey} className="input mt-1" type="file" accept=".pdf,image/*" onChange={(e) => patch('file', e.target.files?.[0] || null)} /></label>
      <label className="mt-3 block text-xs font-semibold">Observações (opcional)<textarea rows={2} className="input mt-1" value={draft.notes} onChange={(e) => patch('notes', e.target.value)} /></label>
      <div className="mt-4 flex justify-end"><button type="button" disabled={busy} className="btn-primary" onClick={add}>{busy ? 'Salvando...' : 'Adicionar cotação'}</button></div>
    </div>
  );

  return (
    <section className="space-y-4" data-testid="project-quotes">
      {showForm && anchor ? createPortal(form, anchor) : null}

      <div className="rounded-sm border border-brand-line bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold uppercase">Aprovação direta — PDF / Imagem</h3>
            <p className="mt-1 text-xs text-gray-500">Área exclusiva para orçamentos avulsos por projeto. Não usa saldo do estoque e não mistura com o comparativo por produto.</p>
          </div>
          <button type="button" className="btn-ghost" disabled={!projects.length} onClick={exportAll}>Exportar histórico completo ({projects.length})</button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`border px-3 py-2 text-xs font-semibold ${statusFilter === value ? 'border-red-600 bg-red-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {!filteredProjects.length ? (
          <p className="border border-dashed p-5 text-sm text-gray-500">Nenhuma cotação encontrada neste filtro. Use PDF / Imagem no formulário acima para adicionar novos orçamentos avulsos.</p>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <article key={project.id} className="rounded-sm border border-brand-line p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold uppercase text-gray-900 dark:text-white">{project.product || project.name || 'Orçamento sem nome'}</div>
                    <div className="mt-1 text-xs text-gray-500">{project.quantity || '—'} {project.unit || 'un'} · {project.supplier || 'Fornecedor não informado'} · {niceDate(project.createdAt)}</div>
                    {project.name && project.name !== project.product && <div className="mt-1 text-xs text-gray-600">Projeto: {project.name}</div>}
                  </div>
                  <span className={`border px-3 py-1 text-xs font-bold ${project.status === 'Aprovado' ? 'border-green-600 text-green-700' : project.status === 'Reprovado' ? 'border-red-600 text-red-700' : 'border-amber-500 text-amber-700'}`}>{project.status || 'Rascunho'}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!['Aprovado', 'Reprovado'].includes(project.status) && (
                    <>
                      <button type="button" className="border border-green-700 px-3 py-2 text-xs font-bold text-green-800" onClick={() => decide(project, 'Aprovado')}>Aprovar</button>
                      <button type="button" className="border border-red-700 px-3 py-2 text-xs font-bold text-red-700" onClick={() => decide(project, 'Reprovado')}>Recusar</button>
                    </>
                  )}
                  {!!project.fileName && <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={() => openAttachment(project)}>Baixar PDF / imagem</button>}
                  <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={() => setExpanded((id) => (id === project.id ? null : project.id))}>{expanded === project.id ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
                  <button type="button" className="ml-auto border px-3 py-2 text-xs text-red-700" onClick={() => remove(project)}>Excluir</button>
                </div>

                {expanded === project.id && (
                  <div className="mt-4 grid gap-3 border-t pt-4 text-xs text-gray-700 dark:text-gray-300 md:grid-cols-2">
                    <div>
                      <div><b>Projeto:</b> {project.name || '—'}</div>
                      <div className="mt-1"><b>Referência:</b> {project.reference || '—'}</div>
                      <div className="mt-1"><b>Anexo:</b> {project.fileName || 'Não informado'}</div>
                    </div>
                    <div>
                      <div><b>Observações:</b> {project.notes || '—'}</div>
                      <div className="mt-1"><b>Decisão registrada em:</b> {project.reviewedAt ? niceDate(project.reviewedAt) : '—'}</div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      
    </section>
  );
}
