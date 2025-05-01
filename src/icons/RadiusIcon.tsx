import React from "react";

export default function RadiusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M17.5205 18.1595C15.886 18.6093 14.1608 18.6135 12.5241 18.1717C10.8874 17.7299 9.39872 16.8581 8.21256 15.6469C7.02641 14.4356 6.18599 12.929 5.7785 11.2834C5.37102 9.6378 5.41132 7.91313 5.89523 6.28834"
        stroke="black"
      />
      <line x1="15.3536" y1="8.35355" x2="8.35355" y2="15.3536" stroke="#FF0000" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="black" />
    </svg>
  );
}
