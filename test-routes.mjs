import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const routes = [
  'http://localhost:3000/',
  'http://localhost:3000/(auth)/login',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/dashboard/donors',
  'http://localhost:3000/dashboard/collections',
  'http://localhost:3000/dashboard/laboratory',
  'http://localhost:3000/dashboard/inventory',
  'http://localhost:3000/dashboard/dispensing',
  'http://localhost:3000/dashboard/disposal',
];

const outDir = 'test-results';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const results = [];

for (const url of routes) {
  const slug = url.replace('http://localhost:3000/', '').replace(/\//g, '_') || 'home';
  const page = await context.newPage();
  
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const entry = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(entry);
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  let httpStatus = null;
  let navigationError = null;
  let pageContent = null;
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    httpStatus = response?.status();
    
    // Wait for hydration
    await page.waitForTimeout(2000);
    
    // Get page content / DOM snapshot
    const html = await page.content();
    pageContent = html;
    
    // Take screenshot
    await page.screenshot({ path: `${outDir}/${slug}.png`, fullPage: true });
    
  } catch (err) {
    navigationError = err.message;
  }

  results.push({
    url,
    slug,
    httpStatus,
    navigationError,
    consoleErrors,
    consoleLogs: consoleLogs.slice(0, 50), // cap
    contentLength: pageContent?.length || 0,
    hasNullError: consoleErrors.some(e => e.toLowerCase().includes('null')),
    hasHydrationError: consoleErrors.some(e => e.toLowerCase().includes('hydrat')),
    hasNegativeVolume: pageContent?.includes('-') && (slug.includes('inventory') || slug.includes('dispensing') || slug.includes('collection')),
  });
  
  await page.close();
}

await browser.close();

// Write report
let report = '# HMBMS Route Test Report\n\n';
for (const r of results) {
  report += `## ${r.url}\n`;
  report += `- **HTTP Status:** ${r.httpStatus ?? 'N/A'}\n`;
  report += `- **Navigation Error:** ${r.navigationError ?? 'None'}\n`;
  report += `- **Console Errors:** ${r.consoleErrors.length}\n`;
  if (r.consoleErrors.length > 0) {
    for (const e of r.consoleErrors) {
      report += `  - ${e}\n`;
    }
  }
  report += `- **Hydration Errors:** ${r.hasHydrationError ? 'YES ⚠️' : 'No'}\n`;
  report += `- **Null Errors:** ${r.hasNullError ? 'YES ⚠️' : 'No'}\n`;
  report += `- **Content Length:** ${r.contentLength}\n`;
  report += `- **Screenshot:** test-results/${r.slug}.png\n\n`;
}

writeFileSync(`${outDir}/report.md`, report);
console.log(JSON.stringify(results, null, 2));
