export const COMPANY_KEY = 'gift_company_profile_v7';
export const DEFAULT_COMPANY = {
  legalName: 'Gift Excellence Comercio e Manutencao LTDA',
  tradeName: 'Gift Excellence Comercio e Manutencao',
  cnpj: '48.969.022/0001-90',
  stateRegistration: '004508789.00-16',
  address: 'Rua Geraldino Figueiredo, nº 373', district: 'Brejão', city: 'Sete Lagoas', state: 'MG', zipCode: '35701-590',
  phone: '', whatsapp: '', email: '', website: 'https://www.giftexcellence.com.br/', instagram: '@giftexcellence_ofc', contact: ''
};
export function readCompany(){try{const saved=JSON.parse(localStorage.getItem(COMPANY_KEY)||'{}');return {...DEFAULT_COMPANY,...saved,...Object.fromEntries(['address','district','city','zipCode','website','instagram'].map(k=>[k,saved[k]||DEFAULT_COMPANY[k]]))}}catch{return {...DEFAULT_COMPANY}}}
export function writeCompany(value){localStorage.setItem(COMPANY_KEY,JSON.stringify(value));window.dispatchEvent(new Event('gift-company-updated'))}
