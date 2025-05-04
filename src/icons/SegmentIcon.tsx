import React from "react";
import iconColor from "./utils/iconColor";

export default function SegmentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="5.88685" y1="6.17974" x2="17.8868" y2="18.1797" stroke={iconColor.basic} />
      <circle cx="6" cy="6" r="2" fill={iconColor.basic} />
      <circle cx="18" cy="18" r="2" fill={iconColor.basic} />
    </svg>
  );
}
