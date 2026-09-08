import React from 'react';
import { SvgXml } from 'react-native-svg';

// Official SmartVibe master lockup. The full SMARTVIBE wordmark is kept
// inside a viewBox with generous horizontal space so VIBE can never be
// clipped on compact/mobile layouts.
const OFFICIAL_SMARTVIBE_LOGO = `<svg width="1200" height="360" viewBox="0 0 1200 360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="markGrad" x1="24" y1="24" x2="132" y2="132" gradientUnits="userSpaceOnUse">
      <stop stop-color="#35F2FF"/>
      <stop offset="0.52" stop-color="#0877F9"/>
      <stop offset="1" stop-color="#06162D"/>
    </linearGradient>
    <linearGradient id="vibeGrad" x1="610" y1="165" x2="1030" y2="165" gradientUnits="userSpaceOnUse">
      <stop stop-color="#35F2FF"/>
      <stop offset="0.5" stop-color="#0877F9"/>
      <stop offset="1" stop-color="#83FF00"/>
    </linearGradient>
    <linearGradient id="nodeGrad" x1="98" y1="18" x2="120" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF51A"/>
      <stop offset="0.5" stop-color="#FFC400"/>
      <stop offset="1" stop-color="#FF5A00"/>
    </linearGradient>
  </defs>
  <g transform="translate(34 78)">
    <path d="M42 28H124L83 76H124L62 138L20 90H61L42 28Z" fill="url(#markGrad)"/>
    <rect x="116" y="12" width="20" height="20" rx="5" fill="url(#nodeGrad)"/>
  </g>
  <text x="205" y="190" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="900" letter-spacing="-3">
    <tspan fill="#FFFFFF">SMART</tspan><tspan fill="url(#vibeGrad)">VIBE</tspan>
  </text>
  <text x="210" y="248" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" letter-spacing="6" fill="#16CFFF">TRADING NETWORK</text>
</svg>`;

export function SmartVibeLogo({ width = 340, height = 102 }: { width?: number; height?: number }) {
  return <SvgXml xml={OFFICIAL_SMARTVIBE_LOGO} width={width} height={height} />;
}
