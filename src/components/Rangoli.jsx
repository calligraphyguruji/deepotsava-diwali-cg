import { useEffect, useRef, useState } from "react";
export default function Rangoli({ colorful = false, className = "" }) {
  const ref = useRef();
  const [bloom, setBloom] = useState(false);
  useEffect(() => {
    if (!colorful) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setBloom(true);
          o.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    o.observe(ref.current);
    return () => o.disconnect();
  }, [colorful]);
  return (
    <svg
      ref={ref}
      className={`rangoli ${colorful ? "colorful" : ""} ${bloom ? "bloom" : ""} ${className}`}
      viewBox="-260 -260 520 520"
      aria-hidden="true"
    >
      <g className="rangoli-turn">
        {[232, 220, 194, 90, 66].map((r) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={r === 220 ? 1 : 0.6}
            strokeDasharray={r === 232 ? "1 7" : undefined}
          />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <g
            className="rangoli-petal"
            style={{ "--delay": `${i * 0.065}s` }}
            key={i}
            transform={`rotate(${i * 15})`}
          >
            <path
              d="M0-95 Q-43-154 0-207 Q43-154 0-95Z"
              fill={
                colorful
                  ? ["#bc527c", "#c68c3f", "#66519b", "#d86b3b"][i % 4]
                  : "currentColor"
              }
              fillOpacity={colorful ? ".6" : ".05"}
              stroke="currentColor"
              strokeWidth=".8"
            />
            <path
              d="M0-130Q-20-170 0-192Q20-170 0-130Z"
              fill="none"
              stroke="currentColor"
              strokeWidth=".5"
            />
            <circle cy="-213" r="3" fill="currentColor" />
            <path
              d="M0-232l-6-12 6-9 6 9Z"
              fill="currentColor"
              fillOpacity=".6"
            />
          </g>
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${i * 30})`}
            d="M0 0Q-53-58 0-89Q53-58 0 0Z"
            fill={colorful ? "#c78543" : "none"}
            fillOpacity=".28"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
        <circle r="24" fill="currentColor" fillOpacity=".15" />
        <circle r="15" fill="none" stroke="currentColor" />
      </g>
    </svg>
  );
}
export function Diya({ lit = true, className = "" }) {
  return (
    <span
      className={`diya ${lit ? "lit" : ""} ${className}`}
      aria-hidden="true"
    >
      <span className="diya-halo" />
      <span className="flame">
        <i />
      </span>
      <span className="wick" />
      <span className="oil" />
      <span className="bowl" />
      <span className="diya-sparks">
        ✦<i>·</i>✧
      </span>
    </span>
  );
}
