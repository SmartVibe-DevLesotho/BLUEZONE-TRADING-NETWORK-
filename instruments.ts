export type AssetClass='Forex'|'Metals'|'Crypto'|'Indices'|'Deriv';
export type Instrument={symbol:string;name:string;class:AssetClass};
const forex=['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','EURGBP','EURJPY','GBPJPY','EURCHF','AUDJPY','EURAUD','GBPAUD','GBPCAD','EURCAD','NZDJPY','CADJPY','CHFJPY','AUDCAD','AUDNZD','AUDCHF','GBPNZD','EURNZD','GBPCHF','CADCHF','NZDCAD','NZDCHF'];
const metals=[['XAUUSD','Gold'],['XAGUSD','Silver'],['XPTUSD','Platinum']];
const crypto=['BTCUSD','ETHUSD','LTCUSD','XRPUSD','LINKUSD','BNBUSD','SOLUSD'];
const indices=['US30','US500','US100','UK100','GER40','JPN225','AUS200'];
const deriv=['V10','V25','V50','V75','V100','Crash 300','Crash 500','Crash 1000','Boom 300','Boom 500','Boom 1000','Step Index','Jump 10','Jump 25','Jump 50','Jump 75','Jump 100','Range Break 100','Range Break 200','DEX 600 UP','DEX 900 DOWN'];
export const instruments:Instrument[]=[...forex.map(symbol=>({symbol,name:symbol,class:'Forex' as const})),...metals.map(([symbol,name])=>({symbol,name,class:'Metals' as const})),...crypto.map(symbol=>({symbol,name:symbol,class:'Crypto' as const})),...indices.map(symbol=>({symbol,name:symbol,class:'Indices' as const})),...deriv.map(symbol=>({symbol,name:symbol,class:'Deriv' as const}))];
