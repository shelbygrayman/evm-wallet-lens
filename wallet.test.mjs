import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
function app(handler=()=> '0x0', responseFactory) {
 const els=new Map(),calls=[];
 const get=id=>{if(!els.has(id))els.set(id,{value:id==='chain'?'0':'',add(){},hidden:true,textContent:'',innerHTML:''});return els.get(id)};
 const c=vm.createContext({document:{getElementById:get},Option:function(){},TextDecoder,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{const r=JSON.parse(opts.body);calls.push({url,...r});if(responseFactory)return responseFactory(r,opts);return new Response(JSON.stringify({jsonrpc:'2.0',id:r.id,result:await handler(url,r)}))}});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1]+'\nglobalThis.api={formatUnits,decodeString,quantity,uintWord,validateURL};',c);
 get('addr').value='0x'+'1'.repeat(40); return {get,calls,api:c.api};
}
test('invalid token markup escaped',async()=>{const a=app();a.get('token').value='<b>test</b>';await a.get('go').onclick();assert.ok(!a.get('out').innerHTML.includes('<b>'));assert.match(a.get('out').innerHTML,/&lt;b/)});
test('RPC errors escaped',async()=>{const a=app(()=>{throw Error('<img src=x>')});await a.get('go').onclick();assert.ok(!a.get('out').innerHTML.includes('<img'));assert.match(a.get('out').innerHTML,/&lt;img/)});
test('custom endpoint never uses preset backup',async()=>{const a=app(()=>{throw Error('offline')});a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.equal(a.calls.length,1)});
test('fallback keeps all reads on one endpoint',async()=>{const a=app((url,r)=>{if(url.includes('eth.drpc.org'))throw Error('offline');return r.method==='eth_chainId'?'0x1':'0x0'});await a.get('go').onclick();assert.equal(a.calls.length,4);assert.ok(a.calls.slice(1).every(c=>c.url==='https://1rpc.io/eth'))});
test('wrong chain stops balance requests',async()=>{const a=app(()=> '0x2105');a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.equal(a.calls.length,1);assert.match(a.get('out').innerHTML,/does not match/)});
test('large integer precision and tiny amounts',async()=>{const a=app((u,r)=>r.method==='eth_getBalance'?'0x1':'0x20000000000001');a.get('chain').value='3';a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.match(a.get('out').innerHTML,/9007199254740993/);assert.match(a.get('out').innerHTML,/&lt;0.000001/)});
test('decimals and quantities bounded',()=>{const {api}=app();assert.throws(()=>api.formatUnits(1n,256));assert.throws(()=>api.quantity('0x00'));assert.throws(()=>api.uintWord('0x1'));assert.equal(api.formatUnits(12345678n,6),'12.345678')});
test('bytes32 token symbols',()=>{assert.equal(app().api.decodeString('0x'+'455448'.padEnd(64,'0')),'ETH')});
test('remote HTTP and embedded credentials rejected',()=>{const {api}=app();assert.throws(()=>api.validateURL('http://example.com'));assert.throws(()=>api.validateURL('https://a:b@example.com'))});
test('duplicate lookup is locked and controls restored',async()=>{let release;const gate=new Promise(r=>release=r);const a=app(async(u,r)=>{await gate;return r.method==='eth_chainId'?'0x1':'0x0'});const first=a.get('go').onclick();assert.equal(a.get('go').disabled,true);await a.get('go').onclick();release();await first;assert.equal(a.calls.length,3);assert.equal(a.get('go').disabled,false)});
test('oversized token batch rejected before network',async()=>{const a=app();a.get('token').value=Array.from({length:21},(_,i)=>'0x'+(i+1).toString(16).padStart(40,'0')).join(',');await a.get('go').onclick();assert.equal(a.calls.length,0);assert.match(a.get('out').innerHTML,/20 token/)});
test('dynamic symbol bounds and offset validated',()=>{const {api}=app();const w=n=>BigInt(n).toString(16).padStart(64,'0');assert.equal(api.decodeString('0x'+w(32)+w(3)+'455448'.padEnd(64,'0')),'ETH');assert.throws(()=>api.decodeString('0x'+w(64)+w(3)+'455448'.padEnd(64,'0')));assert.throws(()=>api.decodeString('0x'+w(32)+w(999999)))});

test('malformed response envelopes rejected and controls restored',async()=>{
 for(const make of [r=>({jsonrpc:'2.0',id:r.id+1,result:'0x1'}),r=>({jsonrpc:'1.0',id:r.id,result:'0x1'}),r=>({jsonrpc:'2.0',id:r.id,result:'0x1',error:{message:'bad'}}),r=>({jsonrpc:'2.0',id:r.id})]) {
  const a=app(undefined,r=>new Response(JSON.stringify(make(r))));a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.match(a.get('out').innerHTML,/Invalid JSON-RPC/);assert.equal(a.get('go').disabled,false);assert.equal(a.calls.length,1);
 }
});
test('HTTP errors and invalid JSON do not leave loading state',async()=>{
 for(const response of [()=>new Response('unavailable',{status:503}),()=>new Response('not json')]) {const a=app(undefined,response);a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.match(a.get('out').innerHTML,/Error:/);assert.equal(a.get('go').disabled,false);}
});
test('oversized response rejected',async()=>{const a=app(undefined,()=>new Response('x'.repeat(1048577)));a.get('rpc').value='https://custom.example';await a.get('go').onclick();assert.match(a.get('out').innerHTML,/exceeds 1 MB/);assert.equal(a.get('go').disabled,false)});
test('malicious token symbol remains escaped in successful lookup',async()=>{
 const a=app((u,r)=>r.method==='eth_chainId'?'0x1':r.method==='eth_call'?(r.params[0].data==='0x95d89b41'?'0x'+Buffer.from('<img src=x>').toString('hex').padEnd(64,'0'):'0x'+'0'.repeat(64)):'0x0');a.get('token').value='0x'+'2'.repeat(40);await a.get('go').onclick();assert.match(a.get('out').innerHTML,/Token: &lt;img/);assert.ok(!a.get('out').innerHTML.includes('<img'));
});
test('network selection is captured before asynchronous reads',async()=>{let release;const gate=new Promise(r=>release=r);const a=app(async(u,r)=>{await gate;return r.method==='eth_chainId'?'0x1':'0x0'});const pending=a.get('go').onclick();a.get('chain').value='3';release();await pending;assert.match(a.get('out').innerHTML,/0 ETH/)});
test('a failing token does not hide native balance or later tokens',async()=>{const a=app((u,r)=>{if(r.method==='eth_chainId')return '0x1';if(r.method!=='eth_call')return '0x0';if(r.params[0].to==='0x'+'2'.repeat(40))throw Error('token unavailable');return r.params[0].data==='0x95d89b41'?'0x'+'455448'.padEnd(64,'0'):'0x'+'0'.repeat(64)});a.get('token').value=['2','3'].map(c=>'0x'+c.repeat(40)).join(',');await a.get('go').onclick();assert.match(a.get('out').innerHTML,/Native balance/);assert.match(a.get('out').innerHTML,/token unavailable/);assert.match(a.get('out').innerHTML,/Token: ETH/)});
