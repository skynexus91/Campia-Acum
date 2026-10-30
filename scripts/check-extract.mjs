import assert from 'node:assert/strict';
import {extractArticle} from '../worker/extract.mjs';
const first='Acesta este primul paragraf al articolului, cu informații complete și detalii relevante pentru comunitate. '.repeat(3);
const last='Acesta este ultimul paragraf și trebuie păstrat integral, până la ultima propoziție.';
for(const[host,selector]of[['turdanews.net','class="entry-content"'],['refleqtmedia.ro','class="td-post-content"'],['inturda.ro','class="shortcode-content"'],['ziarul21.ro','id="content-main"']]){
 const html='<html><body><nav>Meniu nedorit</nav><div '+(host==='inturda.ro'?'class="main-article-content"':'')+'><div '+selector+'><div class="code-block">Reclamă nedorită</div><p>'+first+'</p><h2>Detaliile articolului</h2><ul><li><p>Primul element din listă</p></li><li>Citește și: articol recomandat nedorit</li></ul><p>'+last+'</p><div class="tma-author-box">Autor nedorit</div><section class="social-sharing-top">Share Tweet</section></div></div><aside>Alte articole nedorite</aside></body></html>';
 const r=extractArticle(html,'https://'+host+'/article');assert(r.body.endsWith(last));assert(r.body.includes('• Primul element din listă'));assert(!/nedorit|Share Tweet/.test(r.body));assert(r.paragraphs>=4);
}
assert.throws(()=>extractArticle('<html><body>Nu există articol.</body></html>','https://example.com/news'));
assert.throws(()=>extractArticle('<script type="application/ld+json">{"isAccessibleForFree":false}</script><article><p>'+first+'</p></article>','https://example.com/news'),/restricționat/);
console.log('Passed: full first/last paragraphs, lists, four publication containers, ad/menu/related removal, missing body and restricted access.');
