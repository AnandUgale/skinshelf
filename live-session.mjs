import { IntegrationError } from './youcam.mjs';
export function createLiveSession(unitBudget) {
  const limit=Number.isInteger(unitBudget)&&unitBudget>=9?Math.min(10,Math.floor(unitBudget/9)):0;
  let attempts=0,busy=false,paused=false;
  return {
    get available(){return limit>0&&!busy&&!paused&&attempts<limit;},
    get reservedUnits(){return attempts*9;},
    async run(operation) {
      if(paused)throw new IntegrationError('paused','Live analysis paused until operator review of task status and free units.');
      if(busy||attempts>=limit)throw new IntegrationError('limit','Live request limit reached or analysis in progress. No purchase or automatic retry.');
      attempts++;busy=true;
      try{return await operation();}catch(error){paused=true;throw error;}finally{busy=false;}
    }
  };
}
