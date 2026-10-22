import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import extractor from './gift-extractor.js';
export default defineConfig({plugins:[react(),{name:'gift-local-extractor',configureServer(server){server.middlewares.use(extractor)}}],server:{host:'0.0.0.0'}});
