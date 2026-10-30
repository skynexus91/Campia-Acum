import { parseHTML } from 'linkedom';

const selectors={
 'turdanews.net':['.entry-content'],
 'refleqtmedia.ro':['.tdb_single_content .tdb-block-inner','.td-post-content'],
 'inturda.ro':['.main-article-content .shortcode-content','.main-article-content'],
 'ziarul21.ro':['#content-main']
};
const junk='script,style,noscript,iframe,form,button,nav,aside,footer,[hidden],.butoane-google-turdanews,.ruby-table-contents,.twttr_buttons,.social-sharing-top,.tma-author-box,.entry-bottom,.entry-newsletter,.td-a-ad,.adsbygoogle,.advertisement,.ad-container,[id^="div-gpt"],[id^="google_ads"],.mvp-org-wrap,.posts-nav-link,.post-tags,.social-sharing-bot,.mvp-related-posts,#article-ad,#comments-button,#comments,.related-posts,.related-block,.jp-relatedposts,.sharedaddy,.share-buttons,.social-share,.article-controls,.article-photo,.article-title,.code-block,.wp-block-embed,.rb-related,.related-wrap,.rbi-overlay';
const block=new Set(['P','DIV','SECTION','ARTICLE','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','UL','OL','LI','FIGCAPTION','TR','TABLE']);
function textOf(node){if(node.nodeType===3)return node.textContent;if(node.nodeType!==1)return '';if(node.tagName==='BR')return '\n';const text=[...node.childNodes].map(textOf).join('');return block.has(node.tagName)?'\n\n'+(node.tagName==='LI'?'• '+text.replace(/\s+/g,' ').trim():text)+'\n\n':text;}
function normalize(s){return s.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
export function extractArticle(html,url){
 const {document}=parseHTML(html);const host=new URL(url).hostname.replace(/^www\./,'');
 const schemas=[];for(const e of document.querySelectorAll('script[type="application/ld+json"]')){try{const data=JSON.parse(e.textContent);const walk=o=>{if(!o||typeof o!=='object')return;if(o.isAccessibleForFree===false||o.isAccessibleForFree==='False')throw Error('Conținutul este restricționat de publicație.');if(typeof o.articleBody==='string')schemas.push(o.articleBody);for(const v of Object.values(o))if(v&&typeof v==='object'){if(Array.isArray(v))v.forEach(walk);else walk(v)}};walk(data);}catch(e){if(e.message.includes('restricționat'))throw e;}}
 for(const e of document.querySelectorAll(junk))e.remove();
 let root=null;for(const selector of [...(selectors[host]||[]),'[itemprop="articleBody"]','.entry-content','.post-content','.article-content','article']){const candidate=document.querySelector(selector);if(candidate&&normalize(textOf(candidate)).length>160){root=candidate;break}}
 let body=root?normalize(textOf(root)):'';
 if(root){for(const e of root.querySelectorAll('p,li'))if(/^(citește și|citeste si|vezi și|vezi si|distribuie|share this|urmărește-ne|urmărește știrile)/iu.test(e.textContent.trim()))e.remove();body=normalize(textOf(root));}
 const schema=schemas.map(normalize).sort((a,b)=>b.length-a.length)[0];if(!body&&schema)body=schema;
 if(body.length<160||!root&&!schema)throw Error('Corpul articolului nu a putut fi identificat.');
 if(/(?:\[\s*…\s*\]|\[\.\.\.\])\s*$/.test(body))throw Error('Pagina oferă tot un extras.');
 return {body:body.slice(0,120000),paragraphs:body.split(/\n\n/).length,method:root?'reader-dom':'structured-data'};
}
