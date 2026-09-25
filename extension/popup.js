const API = "http://127.0.0.1:8000";

const $ = id => document.getElementById(id);

chrome.tabs.query({active:true,currentWindow:true}, tabs => {
  const tab = tabs[0];
  $("site").textContent = tab?.url || "No page detected";
});

$("scan").addEventListener("click", async () => {
  $("scan").disabled = true;
  $("loading").classList.remove("hidden");
  $("results").classList.add("hidden");

  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    const data = await chrome.tabs.sendMessage(tab.id, {type:"SCAN"});
    const result = calculateScores(data, tab.url);

    render(result);

    const response = await fetch(`${API}/api/scans`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...result, url:tab.url})
    });

    if (!response.ok) throw new Error("Backend error");
    $("status").textContent = "Report saved to WebGuard backend.";
  } catch (error) {
    $("status").textContent = "Scan completed, but backend is unavailable. Start FastAPI to save reports.";
  } finally {
    $("loading").classList.add("hidden");
    $("results").classList.remove("hidden");
    $("scan").disabled = false;
  }
});

function calculateScores(d, url) {
  const issues = [];

  if (!url.startsWith("https://")) issues.push("Website is not using HTTPS.");
  if (!d.title) issues.push("Missing page title.");
  if (!d.description) issues.push("Missing meta description.");
  if (!d.viewport) issues.push("Missing responsive viewport meta tag.");
  if (d.imagesWithoutAlt > 0) issues.push(`${d.imagesWithoutAlt} image(s) are missing alt text.`);
  if (d.inlineScripts > 8) issues.push("High number of inline script blocks may affect maintainability.");
  if (d.resources > 80) issues.push("High resource count may affect page performance.");
  if (d.loadTime > 3000) issues.push(`Page load time is ${Math.round(d.loadTime)} ms.`);

  const security = url.startsWith("https://") ? 100 : 45;
  const performance = Math.max(35, Math.round(100 - d.resources * .45 - Math.max(0,d.loadTime-1000)/100));
  const seo = Math.max(20, 100 - (!d.title?35:0) - (!d.description?30:0));
  const accessibility = Math.max(20, 100 - Math.min(60,d.imagesWithoutAlt*8) - (!d.viewport?20:0));
  const overall = Math.round((security+performance+seo+accessibility)/4);

  return {security,performance,seo,accessibility,overall,issues};
}

function render(r) {
  $("overall").textContent = r.overall;
  $("security").textContent = r.security;
  $("performance").textContent = r.performance;
  $("seo").textContent = r.seo;
  $("accessibility").textContent = r.accessibility;
  $("issues").innerHTML = r.issues.length
    ? r.issues.map(x=>`<li>${escapeHtml(x)}</li>`).join("")
    : "<li>No major issues found.</li>";
}

function escapeHtml(s){
 return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
