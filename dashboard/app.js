const API="http://127.0.0.1:8000";

async function loadScans(){
  const state=document.getElementById("state");
  state.textContent="Loading…";
  try{
    const res=await fetch(`${API}/api/scans`);
    if(!res.ok) throw new Error();
    const scans=await res.json();
    render(scans);
    state.textContent=`${scans.length} reports`;
  }catch(e){
    state.textContent="Backend offline";
    document.getElementById("table").innerHTML='<p style="color:#999">Start FastAPI, then refresh this page.</p>';
  }
}

function render(scans){
  document.getElementById("total").textContent=scans.length;
  const issues=scans.reduce((n,s)=>n+(s.issues?.length||0),0);
  document.getElementById("issues").textContent=issues;
  const avg=scans.length?Math.round(scans.reduce((n,s)=>n+s.overall,0)/scans.length):0;
  document.getElementById("avg").textContent=avg||"--";

  const html=[
    '<div class="row head"><span>WEBSITE</span><span>OVERALL</span><span>SECURITY</span><span>PERFORMANCE</span><span>SEO</span></div>',
    ...scans.map(s=>`<div class="row">
      <span title="${s.url}">${new URL(s.url).hostname}</span>
      <span class="score ${s.overall<70?'warn':'good'}">${s.overall}</span>
      <span>${s.security}</span><span>${s.performance}</span><span>${s.seo}</span>
    </div>`)
  ].join("");
  document.getElementById("table").innerHTML=html;
}
loadScans();
