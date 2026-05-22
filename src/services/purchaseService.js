import api from'./api';
export const purchaseService={list:()=>api.get('/purchases'),receive:id=>api.post(`/purchases/${id}/receive`)};
