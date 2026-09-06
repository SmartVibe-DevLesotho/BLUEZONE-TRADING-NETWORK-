import { corsHeaders } from '../_shared/cors.ts';

const demo = (symbol: string) => {
  const base: Record<string, number> = { XAUUSD: 3340, XAGUSD: 38.2, XPTUSD: 1360, BTCUSD: 112000, ETHUSD: 4300, LTCUSD: 110, XRPUSD: 2.9, LINKUSD: 25, BNBUSD: 700, SOLUSD: 205, US30: 44000, US500: 6400, US100: 23500, UK100: 9200, GER40: 24200, JPN225: 43000, AUS200: 8900 };
  const price = base[symbol] ?? 100;
  return { symbol, price, change: Number(((Math.random() - .5) * 1.4).toFixed(2)), source: 'demo' };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { symbols = [] } = await req.json();
    const requested = symbols as string[];
    const forex = requested.filter(s => s.length === 6 && !s.includes('USD') ? true : ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD'].includes(s));
    const quotes: any[] = [];
    if (forex.length) {
      try {
        const rates = await fetch('https://api.frankfurter.app/latest?from=USD').then(r => r.json());
        for (const symbol of forex) {
          const a = symbol.slice(0,3), b = symbol.slice(3);
          let price = 1;
          if (a === 'USD') price = rates.rates[b] ?? 1;
          else if (b === 'USD') price = 1 / (rates.rates[a] ?? 1);
          else price = (1 / (rates.rates[a] ?? 1)) * (rates.rates[b] ?? 1);
          quotes.push({ symbol, price, change: Number(((Math.random()-.5)*0.8).toFixed(2)), source: 'frankfurter' });
        }
      } catch (_) {}
    }
    const cryptoMap: Record<string,string> = {BTCUSD:'bitcoin',ETHUSD:'ethereum',LTCUSD:'litecoin',XRPUSD:'ripple',LINKUSD:'chainlink',BNBUSD:'binancecoin',SOLUSD:'solana'};
    const cryptoIds = requested.map(s => cryptoMap[s]).filter(Boolean);
    if (cryptoIds.length) {
      try {
        const data = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`).then(r=>r.json());
        for (const [symbol,id] of Object.entries(cryptoMap)) if (requested.includes(symbol) && data[id]) quotes.push({symbol, price:data[id].usd, change:Number(data[id].usd_24h_change?.toFixed(2) ?? 0), source:'coingecko'});
      } catch (_) {}
    }
    for (const symbol of requested) if (!quotes.some(q=>q.symbol===symbol)) quotes.push(demo(symbol));
    return new Response(JSON.stringify({quotes}), {headers:{...corsHeaders,'Content-Type':'application/json'}});
  } catch (e) {
    return new Response(JSON.stringify({error:String(e)}), {status:400, headers:{...corsHeaders,'Content-Type':'application/json'}});
  }
});
