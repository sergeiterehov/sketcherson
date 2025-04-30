export default function CoincidentIcon(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="11" cy="14" r="4" fill="black" />
      <circle cx="14" cy="11" r="4" fill="#FF0000" />
    </svg>
  );
}
