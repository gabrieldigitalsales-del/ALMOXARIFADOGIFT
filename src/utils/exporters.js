import jsPDF from 'jspdf';import autoTable from 'jspdf-autotable';import * as XLSX from 'xlsx';
export function exportPDF(title,rows){const doc=new jsPDF({orientation:'landscape'});doc.text(title,14,16);autoTable(doc,{startY:24,head:[Object.keys(rows[0]||{})],body:rows.map(r=>Object.values(r).map(v=>typeof v==='object'?JSON.stringify(v):v))});doc.save(`${title}.pdf`)}
export function exportExcel(title,rows){const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,title.substring(0,31));XLSX.writeFile(wb,`${title}.xlsx`)}
export const printPage=()=>window.print();
export function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}
