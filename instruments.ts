export type AssetClass='Forex'|'Metals'|'Crypto'|'Indices'|'Deriv';
export type Instrument={symbol:string;name:string;class:AssetClass;price:number;change:number};
const forex=['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','EURGBP','EURJPY','GBPJPY','EURCHF','AUDJPY','EURAUD','GBPAUD','GBPCAD','EURCAD','NZDJPY','CADJPY','CHFJPY','AUDCAD','AUDNZD','AUDCHF','GBPNZD','EURNZD','GBPCHF','CADCHF','NZDCAD','NZDCHF'];
const metals=[['XAUUSD','Gold'],['XAGUSD','Silver'],['XPTUSD','Platinum']];
const crypto=['BTCUSD','ETHUSD','LTCUSD','XRPUSD','LINKUSD','BNBUSD','SOLUSD'];
const indices=['US30','US500','US100','UK100','GER40','JPN225','AUS200'];
const deriv=['V10','V25','V50','V75','V100','Crash 300','Crash 500','Crash 1000','Boom 300','Boom 500','Boom 1000','Step Index','Jump 10','Jump 25','Jump 50','Jump 75','Jump 100','Range Break 100','Range Break 200','DEX 600 UP','DEX 900 DOWN'];
export const instruments:Instrument[]=[...forex.map((s,i)=>({symbol:s,name:s,class:'Forex' as const,price:1+(i%7)*.013,change:(i%5-2)*.18})),...metals.map(([symbol,name],i)=>({symbol,name,class:'Metals' as const,price:[3340,38,145][i],change:i?-.3:.72})),...crypto.map((s,i)=>({symbol:s,name:s,class:'Crypto' as const,price:[110000,4400,90,2.8,22,1100,190][i],change:(i%4-1)*1.2})),...indices.map((s,i)=>({symbol:s,name:s,class:'Indices' as const,price:39000-i*240,change:(i%3-1)*.45})),...deriv.map((s,i)=>({symbol:s,name:s,class:'Deriv' as const,price:100+i*2.37,change:(i%5-2)*.25}))];
