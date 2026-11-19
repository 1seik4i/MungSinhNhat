import { useEffect, useRef } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';

export const creatorPaths = { edit: '/app/edit', preview: '/app/preview', qr: '/app/qr' };

// Guard both navbar navigation and browser Back/Forward before leaving the editor.
export function useCreatorNavigation({ editor, load, setBusy, setMessage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = Object.keys(creatorPaths).find(key => creatorPaths[key] === location.pathname) || 'edit';
  const latest = useRef({ editor, load, setBusy, setMessage });
  latest.current = { editor, load, setBusy, setMessage };
  const blocker = useBlocker(({currentLocation,nextLocation}) =>
    tab === 'edit' && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const current = latest.current;
    current.setBusy(true);
    current.setMessage('');
    (async () => {
      try {
        await current.editor.current?.prepare();
        await current.load();
        blocker.proceed();
      } catch (error) {
        current.setMessage(error.message);
        blocker.reset();
      } finally { current.setBusy(false); }
    })();
  }, [blocker.state]);

  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [location.pathname]);
  return { tab, navigate: next => navigate(creatorPaths[next]) };
}
