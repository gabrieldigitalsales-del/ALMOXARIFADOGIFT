/** GIFT internal dialogs; never ask for credentials. */
export const giftDialog=(type,message,defaultValue='',meta=null)=>new Promise(resolve=>{
  window.dispatchEvent(new CustomEvent('gift:dialog',{detail:{type,message,defaultValue,meta,resolve}}));
});
export const askConfirm=message=>giftDialog('confirm',message);
export const askInput=(message,defaultValue='')=>giftDialog('input',message,defaultValue);
export const askPhraseConfirm=(message,phrase,options={})=>giftDialog('phrase-confirm',message,'',{phrase,...options});
export const inform=message=>giftDialog('info',message);
