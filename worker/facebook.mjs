import {parseHTML} from 'linkedom';
export const facebookGroups=[
 ['1497945850509770','Locuri de Munca Turda - Campia Turzii'],['campiaturda','Anunturi Campia Turzii-Turda'],['1646963195515378','Piața Câmpia Turzii , Turda , Cluj'],['138872618002688','Anunturi / Campia Turzii'],['621816829070975','Piața Facebook Câmpia Turzii'],['409015682445612','CAMPIA TURZII'],['103381053330201','Stiri din Turda si Campia Turzii'],['320624554940384','Ştiri Turda - Câmpia Turzii'],['1604010889837417','Iubim VIISOARA (Cluj)']
].map(([key,name])=>({id:'facebook-'+key,name,url:'https://www.facebook.com/groups/'+key+'/',type:'facebook',enabled:false}));
export function groupKey(url){const u=new URL(url);if(u.protocol!=='https:'||!/(^|\.)facebook\.com$/.test(u.hostname))throw Error('Adresă Facebook invalidă.');const m=u.pathname.match(/^\/groups\/([A-Za-z0-9._-]+)\/?$/);if(!m)throw Error('Introdu adresa directă a grupului.');return m[1];}
export function normalizePost(post,key){
 const match=String(post.url||'').match(/^https:\/\/(?:www\.)?facebook\.com\/groups\/([^/]+)\/posts\/(\d+)\/?(?:\?[^#]*)?$/);
 if(!match||match[1]!==key||/comment_id|reply_comment_id/i.test(post.url))throw Error('Linkul nu aparține unei postări a grupului selectat.');
 let body=String(post.text||'').slice(0,40000).replace(/\r/g,'').replace(/\n\+\d+\s*$/,'').replace(/\nMessage\s*$/,'').trim();
 const controls=/^(?:Like|Comment|Share|All reactions:|View more comments|Most relevant|See more|Message|\d+)$/;
 if(body.split('\n').every(l=>!l.trim()||controls.test(l.trim())))body='';
 // Only the post body is accepted. No comments, authors, profiles or reaction fields are retained.
 const truncated=!!post.truncated||/See more|…\s*$/.test(body);body=body.replace(/(?:…\s*)?See more/g,'').trim();
 const mediaOnly=!!post.imageOnly||!body||body.endsWith('·')||(/^\d+:\d+\s*\//.test(body)&&!body.split('\n').some(l=>l.trim().length>90));
 const dateLabel=String(post.dateLabel||'').slice(0,120);let date=new Date();let approximate=true;
 const relative=dateLabel.match(/^(\d+)\s*([dhmw])$/i);if(relative){const factor={d:86400000,h:3600000,m:60000,w:604800000};date=new Date(Date.now()-+relative[1]*factor[relative[2].toLowerCase()]);}
 else{const parsed=Date.parse(dateLabel+' '+new Date().getFullYear());if(Number.isFinite(parsed))date=new Date(parsed);}
 const complete=!!body&&!truncated&&!mediaOnly;
 const ad=/\bv[âa]nd\b|vanzare|vânzare|dezmembrez|preț|pret|reclamă|reclama|sonoriz|RON\s*\d|pilote|cadouri personalizate|reducer/i.test(body);
 return{id:'fb-'+key+'-'+match[2],postId:match[2],sourceUrl:'https://www.facebook.com/groups/'+key+'/posts/'+match[2]+'/',body,excerpt:body.replace(/\s+/g,' ').slice(0,280),title:body.split('\n').find(l=>l.trim().length>8)?.slice(0,180)||'Postare media — text de verificat',date:date.toISOString(),dateLabel,dateApproximate:approximate,origin:'facebook',category:key==='1497945850509770'?'Locuri de muncă':'Comunitate',status:complete?'published':'draft',fullContent:complete,ad,ai:false,needsReview:!complete,reviewReason:mediaOnly?'Postare media; textul nu a fost extras.':truncated?'Text trunchiat de Facebook.':null,contentMethod:'browser-post-body',capturedAt:new Date().toISOString()};
}
export async function importFacebookCapture(store,capture){
 const key=String(capture.groupKey||'');if(!/^[A-Za-z0-9._-]{1,70}$/.test(key))throw Error('Identificator de grup invalid.');
 if(!Array.isArray(capture.posts)||capture.posts.length>150)throw Error('Importă cel mult 150 de postări într-un lot.');
 const id='facebook-'+key;const existing=(await store.settings('sources')).find(s=>s.id===id);const source={...existing,id,name:String(capture.groupName||existing?.name||key).slice(0,140),url:'https://www.facebook.com/groups/'+key+'/',type:'facebook',enabled:false,visibility:capture.public===false?'private':'public',lastCaptureAt:new Date().toISOString()};
 if(capture.public===false){source.facebookStatus='private';source.facebookMessage='Grup privat. Postările nu sunt accesibile în sesiunea publică.';await store.put('sources/'+id,source);return{group:source.name,added:0,published:0,drafts:0,private:true};}
 let added=0,updated=0,published=0,drafts=0,rejected=0;
 for(const post of capture.posts){let a;try{a=normalizePost(post,key)}catch{rejected++;continue}const old=await store.get('articles/'+a.id);if(old?.edited||old?.deleted)continue;if(old?.fullContent&&!a.fullContent)continue;const record={...old,...a,sourceId:id,sourceName:source.name};await store.put('articles/'+a.id,record);old?updated++:added++;record.status==='published'?published++:drafts++;}
 source.facebookStatus='browser-import';source.facebookMessage='Captură de browser: '+published+' texte complete, '+drafts+' ciorne de verificat. Nu este o conexiune permanentă.';source.lastCapture={added,updated,published,drafts,rejected};await store.put('sources/'+id,source);return{group:source.name,added,updated,published,drafts,rejected};
}
export function publicFacebookHtml(html,url){
 const key=groupKey(url),{document}=parseHTML(html);const posts=[];const seen=new Set();
 for(const link of document.querySelectorAll('a[href*="/posts/"]')){let href=link.getAttribute('href');try{href=new URL(href,'https://www.facebook.com').href}catch{continue}if(/comment_id/.test(href))continue;const m=href.match(/\/groups\/([^/]+)\/posts\/(\d+)/);if(!m||m[1]!==key||seen.has(m[2]))continue;const root=link.closest('[role="article"]');if(!root)continue;const message=root.querySelector('[data-ad-preview="message"],[data-ad-comet-preview="message"]');if(!message)continue;seen.add(m[2]);posts.push({url:href,text:message.textContent,dateLabel:link.textContent,truncated:/See more/.test(message.textContent)});}
 return{groupKey:key,groupName:document.querySelector('h1')?.textContent||document.title.replace(/ \| Facebook$/,''),public:!document.body.textContent.includes('Private group'),posts};
}
