// Credentials are accepted through stdin only and never written or printed.
import readline from 'node:readline';
console.log('Ready for service configuration JSON on stdin.');
const line=await new Promise(resolve=>{const input=readline.createInterface({input:process.stdin});input.once('line',value=>{input.close();resolve(value)})});
try{
 const {token,mode='update',scheduleId,capturePath}=JSON.parse(line);
 const origin='https://campia-acum-local.soundvenus7.chatgpt.site';
 const headers={'OAI-Sites-Authorization':'Bearer '+token,'X-Background-Token':token,'Content-Type':'application/json'};
 async function request(path,body){const response=await fetch(origin+path,{headers,method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Service request failed: HTTP '+response.status);return response.json();}
 if(mode==='facebook'){const {readFile}=await import('node:fs/promises');const captures=JSON.parse(await readFile(capturePath,'utf8'));for(const capture of captures){const result=await request('/api/background/run',{action:'facebook-import',capture});console.log(JSON.stringify({step:'facebook',...result}));}}
 if(mode==='configure')await request('/api/background/run',{action:'configure',scheduleId});
 if(mode==='update'){const result=await request('/api/background/run',{action:'sync'});console.log(JSON.stringify({step:'sync',added:result.added,sources:result.status.map(s=>({name:s.name,ok:s.ok,skipped:!!s.skipped}))}));let batch;do{batch=await request('/api/background/run',{action:'enrich'});console.log(JSON.stringify({step:'enrich',...batch}));}while(batch.remaining>0&&batch.processed>0);await request('/api/background/run',{action:'finish'});}
 const status=await request('/api/background/status');console.log(JSON.stringify({verified:true,total:status.total,complete:status.complete,pending:status.pending,failed:status.failed,schedule:status.schedule,lastSuccessAt:status.state?.lastSuccessAt,lastOutcome:status.state?.lastOutcome}));
}catch(e){console.error(e.message);process.exitCode=1;}
