import api from'./api';
export const productService={list:()=>api.get('/products'),sync:()=>api.post('/products/sync-stock')};
