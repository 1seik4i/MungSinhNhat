import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import EditorPage from './EditorPage';
import { getYouTubeVideoId } from '../utils/contentSettings';

async function request(path, method='GET', body) {
  const response=await fetch(`/api/platform${path}`,{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const result=await response.json();
  if(!response.ok)throw new Error(result.message || 'Không thể lưu nội dung.');
  return result;
}
export default forwardRef(function AccountEditor({page,onExit,onLogout,onPageSaved,onDirtyChange,onPreview},ref) {
  const revision=useRef(page.revision);
  const saving=useRef(false);
  const latest=useRef(structuredClone(page.draft));
  const editor=useRef(null);
  const current=useRef(structuredClone(page.draft));
  const uploading=useRef(0);
  const callbacks=useRef({onPageSaved,onDirtyChange,onLogout});
  callbacks.current={onPageSaved,onDirtyChange,onLogout};
  const changed=()=>JSON.stringify(current.current)!==JSON.stringify(latest.current);
  const contentChanged=useCallback(content=>{current.current=content;callbacks.current.onDirtyChange?.(JSON.stringify(content)!==JSON.stringify(latest.current));},[]);
  useEffect(()=>{const warn=e=>{if(changed()){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
  useImperativeHandle(ref,()=>({
    prepare:async()=>{if(uploading.current||saving.current||editor.current?.isUploading?.())throw new Error('Đang tải file hoặc lưu nội dung. Vui lòng đợi hoàn tất.');if(changed())await editor.current.save();},
    isDirty:changed,
    isUploading:()=>!!uploading.current||!!editor.current?.isUploading?.(),
  }));
  const services=useMemo(()=>{
    const upload=async file=>{
      uploading.current++;
      try {
      if(file.size>(file.type.startsWith('image/')?5:15)*1024*1024)throw new Error('File vượt giới hạn dung lượng.');
      const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Không đọc được file.'));reader.readAsDataURL(file);});
      return (await request('/media','POST',{dataUrl:String(dataUrl).replace(/^data:audio\/x-wav;/,'data:audio/wav;')})).source;
      } finally { uploading.current--; }
    };
    return {
      loadContentSettings:()=>structuredClone(latest.current),
      fetchServerContentSettings:async()=>{const p=await request('/page');if(p.id!==page.id)throw new Error('Trang đã thay đổi. Hãy đăng nhập lại.');revision.current=p.revision;latest.current=p.draft;return p.draft;},
      saveContentSettings:async content=>{
        if(saving.current)throw new Error('Đang lưu. Vui lòng đợi rồi thử lại.');
        saving.current=true;
        try{const result=await request('/page','PUT',{content,revision:revision.current});revision.current=result.revision;latest.current=structuredClone(content);callbacks.current.onDirtyChange?.(JSON.stringify(current.current)!==JSON.stringify(content));callbacks.current.onPageSaved?.(content,result.revision);return structuredClone(content);}finally{saving.current=false;}
      },
      saveAudioFile:upload,saveImageFile:upload,
      deleteAudioFile:async()=>{}, // Removing from a draft must not delete a published asset.
      getAudioFileUrl:async source=>source,getYouTubeVideoId,
      logoutEditor:()=>callbacks.current.onLogout?.(),
    };
  },[page.id]);
  return <EditorPage ref={editor} onPreview={onPreview} embedded initialContent={page.draft} services={services} onSettingsChange={contentChanged} onExit={onExit}/>;
});
