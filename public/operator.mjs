const $=id=>document.getElementById(id);
$('setup').addEventListener('submit',async event=>{
  event.preventDefault();
  const file=$('sample').files[0];
  if (!file || file.size>10*1024*1024) { $('status').textContent='Choose an authorized PNG under 10 MB.';return; }
  $('prepare').disabled=true;
  let key=$('key').value; $('key').value='';
  try {
    const bytes=new Uint8Array(await file.arrayBuffer());
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const body=JSON.stringify({key,sample:btoa(binary),authorized:$('authorized').checked,freeOnly:$('free').checked});
    key='';$('sample').value='';
    const res=await fetch('/api/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body});
    const result=await res.json();
    if (!res.ok) throw new Error(result.error || 'Preparation failed.');
    $('setup').hidden=true;$('status').textContent='Prepared in local server memory. Open SkinShelf and analyze once. No analysis has run yet.';
  } catch(error) { $('status').textContent=error.message;$('prepare').disabled=false; }
  finally {key='';$('key').value='';$('sample').value='';}
});
