import api from'./api';
export const machineService={list:()=>api.get('/machines'),cost:id=>api.get(`/machines/${id}/cost`)};
