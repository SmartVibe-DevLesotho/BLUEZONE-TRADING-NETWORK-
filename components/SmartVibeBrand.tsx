import React from 'react';
import { SvgXml } from 'react-native-svg';

// Official SmartVibe master lockup. Solid fills maximize compatibility across Android, iOS and web.
const OFFICIAL_SMARTVIBE_LOGO = `<svg width="1200" height="360" viewBox="0 0 1200 360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(34 78)"><path d="M42 28H124L83 76H124L62 138L20 90H61L42 28Z" fill="#0877F9"/><rect x="116" y="12" width="20" height="20" rx="5" fill="#FFC400"/></g>
  <text x="205" y="190" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="900" letter-spacing="-3"><tspan fill="#FFFFFF">SMART</tspan><tspan fill="#16CFFF">VIBE</tspan></text>
  <text x="210" y="248" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" letter-spacing="6" fill="#16CFFF">TRADING NETWORK</text>
</svg>`;
export function SmartVibeLogo({ width = 340, height = 102 }: { width?: number; height?: number }) { return <SvgXml xml={OFFICIAL_SMARTVIBE_LOGO} width={width} height={height} />; }
