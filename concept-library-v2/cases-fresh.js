// Auto-refreshed current-news case layer. Scheduled checks append only genuinely new, classroom-worthy cases here.
const MCL_FRESH_CASES=[];
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
