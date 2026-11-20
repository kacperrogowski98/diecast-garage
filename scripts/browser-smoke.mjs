import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net|danyjoy\.github\.io)/,r=>r.abort());
try {
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 await page.locator('#addBtn').click();
 await page.locator('#fName').fill('Diecast Smoke Test Ferrari F40');
 await page.locator('#fBrand').fill('Ferrari');
 await page.locator('#fClass').selectOption('supercar_hypercar');
 await page.locator('#fStatus').selectOption('owned');
 await page.locator('#fPrice').fill('24.50');
 await page.locator('#modalRoot .modalfoot .btn.primary').click();
 await page.waitForFunction(()=>document.querySelector('#ownedCount')?.textContent==='1');
 assert.ok((await page.locator('#content').innerText()).includes('Diecast Smoke Test Ferrari F40'));
 await page.locator('[data-view="catalog"]').click();
 assert.equal(await page.locator('#rarityFilter').count(),1);
 assert.equal(await page.locator('#sourceFilter').count(),1);
 await page.locator('#search').fill('Ferrari F40');
 await page.locator('#brandFilter').selectOption('Ferrari');
 await page.locator('[data-view="garage"]').click();
 assert.equal(await page.locator('#ownedCount').innerText(),'1');
 assert.ok(!errors.length,'Page JavaScript errors: '+errors.join(' | '));
 console.log('PASS browser smoke: mobile viewport, create/save, garage persistence, catalogue filters');
} finally {await browser.close();}
