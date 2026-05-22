import api from'./api';
export const stockService={list:()=>api.get('/stock'),create:data=>api.post('/stock',data),update:(id,data)=>api.put(`/stock/${id}`,data),remove:id=>api.delete(`/stock/${id}`)};
