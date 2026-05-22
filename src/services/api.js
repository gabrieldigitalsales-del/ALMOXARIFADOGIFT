import axios from'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'/api',timeout:10000});
api.interceptors.response.use(r=>r,error=>Promise.reject(error));
export default api;
