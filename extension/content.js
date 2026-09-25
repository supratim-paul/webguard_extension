chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SCAN") return;

  const navigation = performance.getEntriesByType("navigation")[0];

  sendResponse({
    title: document.title.trim(),
    description: document.querySelector('meta[name="description"]')?.content?.trim() || "",
    viewport: !!document.querySelector('meta[name="viewport"]'),
    imagesWithoutAlt: [...document.images].filter(img => !img.alt.trim()).length,
    inlineScripts: [...document.scripts].filter(s => !s.src).length,
    resources: performance.getEntriesByType("resource").length,
    loadTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0
  });

  return true;
});
