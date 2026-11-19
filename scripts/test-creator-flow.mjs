import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const folder=await mkdtemp(join(process.cwd(),'.creator-test-'));
try {
  const outfile=join(folder,'tests.mjs');
  await build({entryPoints:['src/components/creator-flow.test.jsx'],outfile,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'mock-celebration-canvas',setup(build){build.onLoad({filter:/confettiHelper\.js$/},()=>({contents:'export const blastConfetti=()=>{},blastStars=()=>{},blastHearts=()=>{},launchWishCelebration=()=>{},launchSideCannons=()=>{},launchFireworksShow=()=>{};',loader:'js'}));}}],loader:{'.png':'dataurl','.webp':'dataurl','.css':'empty'},logLevel:'silent'});
  await import(pathToFileURL(outfile).href);
} finally { await rm(folder,{recursive:true,force:true}); }
