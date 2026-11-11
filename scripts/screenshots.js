import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(1000);
 for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=600){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);}
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(900);
 await page.screenshot({path:`artifacts/${name}-full.png`,fullPage:true});
 await page.screenshot({path:`artifacts/${name}-hero.png`});
 await page.locator('#packages').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/${name}-packages.png`});
 await page.close();
}
await browser.close();
