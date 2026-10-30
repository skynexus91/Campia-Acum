// This bookmarklet reads only rendered post bodies. It never reads cookies,
// credentials, comments, replies or reactions, and sends no network requests.
(async()=>{
 if(!/(^|\.)facebook\.com$/.test(location.hostname)){alert('Deschide mai întâi un grup Facebook.');return;}
 const key=location.pathname.match(/^\/groups\/([^/]+)/)?.[1];if(!key){alert('Deschide pagina grupului.');return;}
 const posts=[],seen=new Set();
 for(const a of document.querySelectorAll('a[href*="/posts/"]')){
  if(a.href.includes('comment_id'))continue;const m=a.href.match(/\/groups\/([^/]+)\/posts\/(\d+)/);if(!m||m[1]!==key||seen.has(m[2]))continue;
  let root=a;while(root&&!(root.innerText?.includes('Comment')&&root.querySelector('h2,[role="heading"][aria-level="2"]')))root=root.parentElement;
  if(!root||root===document.body)continue;const children=Array.from(root.children),header=children.find(c=>c.contains(a)),body=children[children.indexOf(header)+1];if(!body)continue;
  const text=body.innerText.trim();seen.add(m[2]);posts.push({url:'https://www.facebook.com/groups/'+key+'/posts/'+m[2]+'/',text,dateLabel:a.innerText,imageOnly:!text&&!!body.querySelector('img'),truncated:/See more/.test(text)});
 }
 const capture=JSON.stringify({groupKey:key,groupName:document.querySelector('h1')?.innerText||document.title.replace(/ \| Facebook$/,''),public:!document.body.innerText.includes('Private group'),posts},null,2);
 try{await navigator.clipboard.writeText(capture);alert(posts.length+' postări copiate, fără comentarii. Revino în Admin → Facebook și importă captura.');}catch{prompt('Copiază captura și import-o în Admin → Facebook:',capture);}
})();
