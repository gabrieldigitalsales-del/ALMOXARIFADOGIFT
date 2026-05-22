import{useEffect,useState}from'react';
export function useLocalStorage(key,initial){const[state,setState]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))??initial}catch{return initial}});useEffect(()=>{localStorage.setItem(key,JSON.stringify(state))},[key,state]);return[state,setState]}
