// Auto-refreshed current-news case layer. Scheduled checks append only genuinely new, classroom-worthy cases here.
const MCL_FRESH_CASES=[
{id:'michaels-fine-art-month',company:'Michaels',title:'Michaels turns August into a month-long experiential promotion',summary:'Michaels created Fine Art Month by combining free in-store and online classes, product demonstrations, an expanded premium assortment, BOGO offers and a social giveaway to attract artists and strengthen its position as a creative destination.',url:'https://www.michaelspressroom.com/news/detail/5091/michaels-declares-august-fine-art-month-with-in-store',date:'2026-08-03',hubs:['promo','sell','mix','brand'],tags:['Experiential Marketing','Sales Promotion','Event Marketing','Product Assortment','Product Sampling','Customer Experience','Omnichannel Retail','Community Marketing','Positioning']},
{id:'adidas-arte-fw26',company:'adidas + Arte Antwerp',title:'adidas and Arte Antwerp use football culture to shape a fashion collaboration',summary:'adidas and Arte Antwerp built a global FW26 capsule around football identity, street culture and 1990s nostalgia, reworking familiar adidas products through a partner brand’s design language and launching the collection worldwide.',url:'https://news.adidas.com/sportswear/adidas-and-arte-antwerp-drop-new-collection--an-ode-to-the-culture-of-football/s/395439a4-6bf2-4d54-8d42-b9613ca1d515',date:'2026-07-29',hubs:['fashion','brand','promo','sem','mix'],tags:['Brand Collaboration','Co-Branding','Sports Marketing','Cultural Marketing','Nostalgia Marketing','Product Assortment','Product Development','Global Marketing','Positioning']},
{id:'target-back-to-school-2026',company:'Target',title:'Target combines price cuts, personalization and in-store events for back-to-school',summary:'Target’s 2026 back-to-school strategy pairs lower prices and Target Circle offers with expanded store events, personalization activities, sampling and campus-timed move-in experiences designed around students, families and teachers.',url:'https://corporate.target.com/press/release/2026/07/target-helps-students-head-back-to-school-and-college-with-style-and-savings',date:'2026-07-22',hubs:['promo','target','sell','mix','strategy'],tags:['Sales Promotion','Pricing Strategy','Target Market','Experiential Marketing','Personalization','Customer Experience','Seasonal Marketing','Loyalty Program','Retailing','Segmentation']},
{id:'tapestry-coach-amplify-2026',company:'Tapestry / Coach',title:'Coach grows by pairing Gen Z customer acquisition with higher-value products',summary:'Tapestry reported that Coach grew strongly in fiscal 2026 while about 35% of new customers were Gen Z, handbag average unit retail rose at a mid-teens rate, direct-to-consumer revenue increased and marketing investment expanded—showing how targeting, product value, pricing and channel strategy can work together.',url:'https://tapestry.gcs-web.com/news-releases/news-release-details/tapestry-inc-reports-fiscal-2026-fourth-quarter-and-full-year',date:'2026-08-13',hubs:['fashion','brand','target','strategy','mix'],tags:['Gen Z','Target Market','Customer Acquisition','Brand Equity','Pricing Strategy','Direct-to-Consumer','Omnichannel Retail','Product Strategy','Growth Strategy','KPI']}
];
MCL_FRESH_CASES.forEach(c=>{
  if(!MCL_CASE_BY_ID[c.id]){
    MCL_CASES.push(c);
    MCL_CASE_BY_ID[c.id]=c;
    for(const h of c.hubs||[]){
      if(MCL_HUB_CASES[h]&&!MCL_HUB_CASES[h].includes(c.id)) MCL_HUB_CASES[h].push(c.id);
    }
  }
});
window.MCL_FRESH_CASES=MCL_FRESH_CASES;
window.MCL_CASES=MCL_CASES;
