import React from "react";

interface ALRLogoProps {
  className?: string;
  size?: number;
}

export default function ALRLogo({ className = "", size = 200 }: ALRLogoProps) {
  return (
    <img
      src="img/LogoEquipo.png"
      alt="ALR Logo"
      width={size}
      className={`select-none object-contain ${className}`}
      style={{ height: 'auto', maxWidth: '100%' }}
    />
  );
}
