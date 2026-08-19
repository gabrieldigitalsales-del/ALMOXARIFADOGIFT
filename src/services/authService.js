export const USERS=[
 {username:'admin',password:'asd123',role:'admin',name:'Administrador'},
 {username:'administrador',password:'asd123',role:'admin',name:'Administrador'},
 {username:'almoxarifado',password:'gift123',role:'almox',name:'Funcionário Almoxarifado'},
 {username:'funcionario',password:'gift123',role:'almox',name:'Funcionário Almoxarifado'},
];
export const authService={
 login:({username='',password=''})=>USERS.find(u=>u.username.toLowerCase()===String(username).trim().toLowerCase()&&u.password===password)||null,
 logout:()=>true
};
