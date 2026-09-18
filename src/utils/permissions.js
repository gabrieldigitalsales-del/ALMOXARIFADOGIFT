export const ADMIN_ROLE='admin';
export const ALMOX_ROLE='almox';
export const BRUNO_ROLE='garantia';

export const isAdmin=auth=>auth?.role===ADMIN_ROLE||(!auth?.role&&auth?.logged);
export const isAlmox=auth=>auth?.role===ALMOX_ROLE;
export const isBrunoLimited=auth=>auth?.role===BRUNO_ROLE;

const almoxRoutes=new Set(['/','/estoque','/produtos','/movimentacao-rapida','/movimentacoes','/colaboradores']);
const brunoRoutes=new Set(['/garantias']);

export const defaultRouteForAuth=auth=>{
 if(isAdmin(auth))return '/';
 if(isAlmox(auth))return '/movimentacoes';
 if(isBrunoLimited(auth))return '/garantias';
 return '/login';
};

export const roleLabel=auth=>{
 if(isAdmin(auth))return 'Administrador';
 if(isAlmox(auth))return 'Almoxarifado';
 if(isBrunoLimited(auth))return 'Bruno • Garantia';
 return 'Usuário';
};

export const canAccessRoute=(auth,path)=>{
 if(isAdmin(auth))return true;
 if(isAlmox(auth))return almoxRoutes.has(path);
 if(isBrunoLimited(auth))return brunoRoutes.has(path);
 return false;
};
