import {supabase,isSupabaseConfigured} from './supabaseClient';

export async function login(username,password){
  if(!isSupabaseConfigured||!supabase)throw new Error('Supabase não configurado');
  const{data,error}=await supabase.rpc('giftx_almox_login',{p_username:username,p_password:password});
  if(error)throw error;
  if(!data?.token)throw new Error('Usuário ou senha incorretos');
  return{logged:true,token:String(data.token),role:data.role,user:data.user,expiresAt:data.expiresAt};
}
export async function logout(token){
  if(!supabase||!token)return true;
  await supabase.rpc('giftx_almox_logout',{p_token:token});
  return true;
}
export async function validateSession(token){
  if(!supabase||!token)return null;
  const{data,error}=await supabase.rpc('giftx_almox_validate_session',{p_token:token});
  if(error)return null;
  return data||null;
}
export const authService={login,logout,validateSession};
