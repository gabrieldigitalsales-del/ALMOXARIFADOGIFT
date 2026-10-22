export const MENU_ITEMS = [
['/','Dashboard'],['/orcamentos','Orçamentos'],['/ordens-servico','Ordens de Serviço'],['/fretes','Cotações de Frete'],['/estoque','Estoque'],['/compras','Compras Inteligentes'],['/movimentacao-rapida','Movimentação Rápida'],['/movimentacoes','Movimentações'],['/colaboradores','Colaboradores'],['/maquinas','Máquinas'],['/montagem','Montar Máquina'],['/bom','BOM / Estrutura'],['/organizacao','Organização'],['/produtividade','Produtividade'],['/garantias','Garantias / WhatsApp'],['/maquinas-vendidas','Máquinas Vendidas'],['/relatorios','Relatórios'],['/configuracoes','Configurações']
];
export const menuVisible = (settings,path) => path==='/configuracoes' || (settings?.menuVisibility?.[path] ?? path!=='/ordens-servico');
