import {useEffect,useState} from 'react';
const namespace='gift-sandbox-local-v1:';
export function useLocalStorage(key,initial){
  const isolatedKey=namespace+key;
  const[state,setState]=useState(()=>{try{return JSON.parse(localStorage.getItem(isolatedKey))??initial}catch{return initial}});
  useEffect(()=>{try{localStorage.setItem(isolatedKey,JSON.stringify(state))}catch(e){console.error('Armazenamento local cheio',e)}},[isolatedKey,state]);
  return[state,setState];
}
