export const ADMIN_ROLE='admin';
export const ALMOX_ROLE='almox';
export const isAdmin=auth=>auth?.role===ADMIN_ROLE||(!auth?.role&&auth?.logged);
export const restrictedRoutes=new Set(['/orcamentos','/ordens-servico','/fretes','/compras','/maquinas','/montagem','/bom','/garantias','/maquinas-vendidas','/relatorios','/configuracoes']);
export const canAccessRoute=(auth,path)=>isAdmin(auth)||!restrictedRoutes.has(path);
