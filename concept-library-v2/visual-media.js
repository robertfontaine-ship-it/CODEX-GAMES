// Visual media layer: real case imagery, 30 key concept diagrams, and lightweight boss-mission briefing art.
(function(){
const CASE_IMAGES=[
 {match:c=>c.id==='nike-snkrs'||/SNKRS Showcase/i.test(c.title||''),url:'https://nmp.about.nike.com/about/prod/c832d9cd-e853-431b-b0d4-ad52b40c6413/snkrs-showcase-horizontal.jpg?m=eyJlZGl0cyI6eyJqcGVnIjp7InF1YWxpdHkiOjEwMH0sIndlYnAiOnsicXVhbGl0eSI6MTAwfSwiZXh0cmFjdCI6eyJsZWZ0IjowLCJ0b3AiOjAsIndpZHRoIjozMjAwLCJoZWlnaHQiOjIxMzF9LCJyZXNpemUiOnsid2lkdGgiOjM4NDB9fX0%3D&s=ab99874debc25097b4349c35d4349272437dcd684988699c588fd2e24a079796',alt:'A collection of Nike footwear featured in the SNKRS Showcase.'},
 {match:c=>c.id==='starbucks-secret'||/secret menu/i.test(c.title||''),url:'https://about.starbucks.com/uploads/2025/07/FY25-Secret-Menu-Launch-Week-Hero-Asset.jpg',alt:'Starbucks Secret Menu campaign creative featuring customized drinks.'},
 {match:c=>c.id==='coke-share'||/Share a Coke/i.test(c.title||''),url:'https://www.coca-colacompany.com/content/dam/corporate/us/en/media-center/241203%20-%20Coca-Cola_00419_RGB-16x9.png',alt:'Friends toasting with personalized Coca-Cola bottles from the Share a Coke campaign.'},
 {match:c=>c.id==='spotify-wrapped'||/Wrapped/i.test(c.title||''),url:'https://storage.googleapis.com/pr-newsroom-wp/1/2025/12/25_1128_Wrapped-Header_Horizontal-Dark_7-1920x733.png',alt:'Spotify 2025 Wrapped campaign graphic.'},
 {match:c=>c.id==='mcd-minecraft'||/Minecraft/i.test(c.title||''),url:'https://corporate.mcdonalds.com/content/dam/sites/corp/nfl/newsroom/TSQ_PRStill_1920x1080_0317_Titled.jpg',alt:'McDonald’s and A Minecraft Movie campaign characters and collectibles.'},
 {match:c=>/Lollapalooza/i.test(c.title||''),url:'https://news.airbnb.com/wp-content/uploads/sites/4/2026/07/Lollapalooza-cropped-3000x2000-1.jpg?w=2500',alt:'Airbnb Lollapalooza fan experience campaign image.'}
];
function mediaForCase(c){return CASE_IMAGES.find(x=>x.match(c))||null}

const D={
 'Marketing':{k:'cycle',title:'Marketing creates and exchanges value',n:['Understand','Create Value','Communicate','Deliver']},
 'Marketing Functions':{k:'cycle',title:'Functions work as one system',n:['Research','Product','Pricing','Promotion','Selling','Distribution']},
 'Market Research':{k:'flow',title:'From question to decision',n:['Business Question','Collect Data','Analyze','Decision']},
 'Primary Research':{k:'flow',title:'Collect new evidence',n:['Question','Survey / Interview','Responses','Insight']},
 'Secondary Research':{k:'flow',title:'Use evidence that already exists',n:['Question','Find Sources','Compare Data','Insight']},
 'Consumer Behavior':{k:'funnel',title:'What shapes a purchase',n:['Need / Want','Information','Evaluation','Purchase','Experience']},
 'Target Market':{k:'funnel',title:'Focus from broad market to best-fit customer',n:['Total Market','Segments','Target','Customer Persona']},
 'Market Segmentation':{k:'four',title:'Four common segmentation lenses',n:['Demographic','Psychographic','Geographic','Behavioral']},
 'Demographics':{k:'cluster',title:'Measurable characteristics',n:['Age','Income','Occupation','Education','Family']},
 'Psychographics':{k:'cluster',title:'How customers think and live',n:['Values','Lifestyle','Interests','Attitudes','Personality']},
 'Behavioral Segmentation':{k:'cluster',title:'What customers do',n:['Usage','Loyalty','Occasion','Benefits Sought','Purchase Pattern']},
 'Positioning':{k:'compare',title:'Own a clear place in the customer’s mind',n:['Your Brand','Competitor'],s:['Desired Meaning','Alternative Meaning']},
 'Marketing Mix':{k:'four',title:'The 4Ps must work together',n:['Product','Price','Place','Promotion']},
 'Product':{k:'layers',title:'A product is more than the physical item',n:['Core Benefit','Actual Product','Added Experience']},
 'Price':{k:'equation',title:'Price connects value, cost, and demand',n:['Customer Value','Price','Business Margin']},
 'Place':{k:'flow',title:'Make value available',n:['Producer','Channel','Customer']},
 'Promotion':{k:'funnel',title:'Move customers toward action',n:['Awareness','Interest','Consideration','Action']},
 'Brand Identity':{k:'layers',title:'What the brand intentionally sends',n:['Visuals','Voice','Values','Experience']},
 'Brand Image':{k:'compare',title:'Identity is sent; image is received',n:['Brand Identity','Brand Image'],s:['What company intends','What customers perceive']},
 'Brand Equity':{k:'equation',title:'Recognition + meaning can add value',n:['Awareness','Positive Associations','Trust / Preference']},
 'Advertising':{k:'flow',title:'Paid message through media',n:['Advertiser','Paid Media','Audience','Response']},
 'Sales Promotion':{k:'flow',title:'Short-term incentive → action now',n:['Offer','Urgency','Customer Action']},
 'Public Relations':{k:'flow',title:'Build trust through relationships and earned attention',n:['Organization','Stakeholders / Media','Reputation']},
 'Sales Process':{k:'cycle',title:'Selling is a sequence, not one pitch',n:['Approach','Discover','Present','Handle Objections','Close','Follow-Up']},
 'Service Recovery':{k:'flow',title:'Turn a failure into a trust-building response',n:['Failure','Listen','Fix','Follow-Up','Loyalty Chance']},
 'SWOT':{k:'matrix',title:'Internal vs. external strategic evidence',n:['Strengths','Weaknesses','Opportunities','Threats']},
 'Break-Even':{k:'equation',title:'When revenue finally covers total cost',n:['Fixed Costs','Contribution per Unit','Break-Even Units']},
 'Sponsorship Activation':{k:'flow',title:'A sponsorship needs activation to create value',n:['Rights','Activation','Fan Experience','Brand Result']},
 'Visual Merchandising':{k:'layers',title:'The store environment communicates before a salesperson does',n:['Layout','Display','Lighting / Color','Product Story']},
 'Business Model':{k:'four',title:'How a venture creates, delivers, and captures value',n:['Customer','Value Proposition','Operations / Channels','Revenue & Costs']}
};
function diagram(d,term){
 const nodes=d.n||[];
 if(d.k==='matrix')return `<div class="diagram matrix">${nodes.map((x,i)=>`<div><span>${i+1}</span><b>${esc(x)}</b></div>`).join('')}</div>`;
 if(d.k==='four')return `<div class="diagram four"><div class="dcenter">${esc(term)}</div>${nodes.map(x=>`<div class="dnode">${esc(x)}</div>`).join('')}</div>`;
 if(d.k==='compare')return `<div class="diagram compare"><div><b>${esc(nodes[0]||'A')}</b><small>${esc(d.s?.[0]||'')}</small></div><span>VS</span><div><b>${esc(nodes[1]||'B')}</b><small>${esc(d.s?.[1]||'')}</small></div></div>`;
 if(d.k==='funnel')return `<div class="diagram funnel">${nodes.map((x,i)=>`<div style="--i:${i};--n:${nodes.length}">${esc(x)}</div>`).join('')}</div>`;
 if(d.k==='equation')return `<div class="diagram equation">${nodes.map((x,i)=>`${i?'<span>→</span>':''}<div>${esc(x)}</div>`).join('')}</div>`;
 if(d.k==='layers')return `<div class="diagram layers">${nodes.map((x,i)=>`<div style="--i:${i}">${esc(x)}</div>`).join('')}</div>`;
 if(d.k==='cluster')return `<div class="diagram cluster"><div class="dcenter">${esc(term)}</div>${nodes.map(x=>`<div class="dnode">${esc(x)}</div>`).join('')}</div>`;
 if(d.k==='cycle')return `<div class="diagram cycle">${nodes.map((x,i)=>`<div><span>${i+1}</span>${esc(x)}</div>`).join('')}</div>`;
 return `<div class="diagram flow">${nodes.map((x,i)=>`${i?'<span>→</span>':''}<div>${esc(x)}</div>`).join('')}</div>`;
}
const HUB_ART={fund:['◉','ASK','LEARN','DECIDE'],target:['⌖','MARKET','SEGMENT','TARGET'],mix:['◫','PRODUCT','PRICE','PLACE'],brand:['◇','IDENTITY','MEANING','MEMORY'],promo:['◉','MESSAGE','CHANNEL','ACTION'],sell:['↗','LISTEN','SOLVE','FOLLOW UP'],strategy:['△','EVIDENCE','CHOICE','RESULT'],sem:['★','FANS','EXPERIENCE','REVENUE'],fashion:['✦','TREND','ASSORTMENT','DISPLAY'],ent:['◆','PROBLEM','VALUE','MODEL']};
function missionArt(h){const a=HUB_ART[h[0]]||['◆','BRIEF','DECIDE','ADAPT'];return `<div class="briefArt" aria-hidden="true"><div class="briefGlyph">${a[0]}</div><div class="briefTrack"><span>${a[1]}</span><i>→</i><span>${a[2]}</span><i>→</i><span>${a[3]}</span></div></div>`}
function enhanceTermVisual(){if(S.r!=='term'||!S.t||!TB[S.t])return;const d=D[S.t];if(!d)return;const card=A.querySelector('.termVisualCard');if(!card||card.dataset.richDiagram)return;card.dataset.richDiagram='1';card.innerHTML=`<div class="ey">Visual Explainer</div><h3>${esc(d.title)}</h3>${diagram(d,S.t)}<small class="visualHint">Use the diagram as a memory cue—not a replacement for the definition.</small>`}
function enhanceCaseImage(){if(S.r==='term'&&S.t&&TB[S.t]){const c=mclCaseFor(S.t,TB[S.t].h),m=mediaForCase(c),card=A.querySelector('.caseStudy');if(card&&!card.querySelector('.caseMedia')){const html=m?`<figure class="caseMedia"><img src="${m.url}" alt="${esc(m.alt)}" loading="lazy"><figcaption>Campaign/source image · ${esc(c.company)}</figcaption></figure>`:`<div class="caseMedia caseFallback"><div>${esc(c.company)}</div><span>${esc((c.tags||[]).slice(0,3).join(' · '))}</span></div>`;card.insertAdjacentHTML('afterbegin',html)}}if(S.r==='fresh'){A.querySelectorAll('.freshCard').forEach(card=>{if(card.querySelector('.caseMedia'))return;const title=card.querySelector('h3')?.textContent||'';const c=MCL_CASES.find(x=>x.title===title);if(!c)return;const m=mediaForCase(c);if(m)card.insertAdjacentHTML('afterbegin',`<figure class="caseMedia freshMedia"><img src="${m.url}" alt="${esc(m.alt)}" loading="lazy"></figure>`)})}}
function enhanceMissionArt(){if(S.r!=='hub'||!S.h||!HB[S.h])return;const h=HB[S.h];A.querySelectorAll('.gameMission').forEach(m=>{if(m.querySelector('.briefArt'))return;const briefing=m.querySelector('.briefing');if(briefing)briefing.insertAdjacentHTML('afterbegin',missionArt(h))})}
function enhanceHubVisual(){if(S.r!=='hub'||!S.h)return;const h=HB[S.h],visual=A.querySelector('.cleanVisual');if(!visual||visual.dataset.mediaUp)return;visual.dataset.mediaUp='1';const key=h[6].map(x=>x[0]).find(n=>D[n]);if(!key)return;const d=D[key];visual.querySelector('.visualMap')?.insertAdjacentHTML('beforebegin',`<div class="hubMiniDiagram"><b>${esc(key)}</b>${diagram(d,key)}</div>`)}
function enhance(){try{enhanceTermVisual();enhanceCaseImage();enhanceMissionArt();enhanceHubVisual()}catch(e){console.warn('Visual media layer:',e)}}
const obs=new MutationObserver(enhance);obs.observe(A,{childList:true,subtree:true});setTimeout(enhance,0);
})();