import { catalog } from './fixtures.mjs';
import { decide } from './domain.mjs';
const scenarios=[0,300,399,500].flatMap(budget=>[
  {budget,fragranceFree:false,lightweight:false},
  {budget,fragranceFree:true,lightweight:false},
  {budget,fragranceFree:true,lightweight:true}
]);
const cases=scenarios.map(input=>{
  const output=decide(catalog,input);
  const baseline=catalog.filter(x=>x.price<=input.budget).sort((a,b)=>a.price-b.price)[0];
  const violates=p=>!!p&&((p.price>input.budget)||(input.fragranceFree&&!p.fragranceFree)||(input.lightweight&&!p.lightweight));
  return {input,baseline:baseline?.id??null,suggested:output.suggested,baselineViolatesPreference:violates(baseline),hardConstraintViolation:output.eligible.some(violates),deterministic:JSON.stringify(output)===JSON.stringify(decide(catalog,input)),keepOption:output.keep.price===0};
});
console.log(JSON.stringify({kind:'Synthetic engineering scenarios; no people or skin-effectiveness ground truth',scenarios:cases.length,hardConstraintViolations:cases.filter(x=>x.hardConstraintViolation).length,baselinePreferenceViolations:cases.filter(x=>x.baselineViolatesPreference).length,deterministicCases:cases.filter(x=>x.deterministic).length,keepOptionCases:cases.filter(x=>x.keepOption).length,cases},null,2));
if(cases.some(x=>x.hardConstraintViolation||!x.deterministic||!x.keepOption))process.exitCode=1;
