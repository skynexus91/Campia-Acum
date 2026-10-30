import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
export class LocalBucket{
 constructor(root='.local-data'){this.root=resolve(root)}
 path(key){if(!/^[a-zA-Z0-9_/-]+$/.test(key))throw Error('Invalid key');return resolve(this.root,key+'.json')}
 async get(key){try{const body=await readFile(this.path(key),'utf8');return{json:async()=>JSON.parse(body)}}catch(e){if(e.code==='ENOENT')return null;throw e}}
 async put(key,body){const path=this.path(key);await mkdir(dirname(path),{recursive:true});await writeFile(path,body)}
 async list({prefix}){const dir=resolve(this.root,prefix);try{return{objects:(await readdir(dir)).filter(x=>x.endsWith('.json')).map(x=>({key:prefix+x.slice(0,-5)})),truncated:false}}catch(e){if(e.code==='ENOENT')return{objects:[],truncated:false};throw e}}
}
