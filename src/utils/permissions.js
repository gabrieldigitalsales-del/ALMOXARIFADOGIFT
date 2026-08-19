export const ADMIN_ROLE='admin';
export const ALMOX_ROLE='almox';
export const isAdmin=auth=>auth?.role===ADMIN_ROLE||(!auth?.role&&auth?.logged);
export const canSeeCosts=auth=>isAdmin(auth);
export const restrictedRoutes=new Set(['/maquinas','/montagem','/bom','/compras','/ops','/garantias','/relatorios','/configuracoes']);
export const canAccessRoute=(auth,path)=>isAdmin(auth)||!restrictedRoutes.has(path);
export const moneyHidden='Restrito';
