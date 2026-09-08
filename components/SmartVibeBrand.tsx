import React from 'react';
import { SvgXml } from 'react-native-svg';

// Single, high-contrast SmartVibe master lockup used across the app.
// Keep the full SMARTVIBE wordmark visible at every supported viewport.
const OFFICIAL_SMARTVIBE_LOGO = `<svg width="900" height="260" viewBox="0 0 900 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="markGrad" x1="18" y1="18" x2="112" y2="112" gradientUnits="userSpaceOnUse">
      <stop stop-color="#35F2FF"/>
      <stop offset="0.52" stop-color="#0877F9"/>
      <stop offset="1" stop-color="#06162D"/>
    </linearGradient>
    <linearGradient id="vibeGrad" x1="520" y1="120" x2="770" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="#35F2FF"/>
      <stop offset="0.5" stop-color="#0877F9"/>
      <stop offset="1" stop-color="#83FF00"/>
    </linearGradient>
    <linearGradient id="nodeGrad" x1="82" y1="8" x2="100" y2="26" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF51A"/>
      <stop offset="0.5" stop-color="#FFC400"/>
      <stop offset="1" stop-color="#FF5A00"/>
    </linearGradient>
  </defs>
  <g transform="translate(22 52)">
    <path d="M30 20H90L60 55H90L45 100L15 65H45L30 20Z" fill="url(#markGrad)"/>
    <rect x="86" y="8" width="14" height="14" rx="3" fill="url(#nodeGrad)"/>
  </g>
  <text x="175" y="145" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" letter-spacing="-3">
    <tspan fill="#FFFFFF">SMART</tspan><tspan fill="url(#vibeGrad)">VIBE</tspan>
  </text>
  <text x="178" y="192" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" letter-spacing="5" fill="#16CFFF">COMPUTER SOLUTIONS</text>
</svg>`;

export function SmartVibeLogo({ width = 320, height = 93 }: { width?: number; height?: number }) {
  return <SvgXml xml={OFFICIAL_SMARTVIBE_LOGO} width={width} height={height} />;
}
