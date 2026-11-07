import { useId } from "react";
import { PALETTE } from "./catalog";
function Crown({ color = "#ffcf7b", x = 70, y = 44, r = 31 }) {
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <g key={i} stroke={color} strokeLinecap="round">
            <line
              x1={x + Math.cos(a) * r * 0.35}
              y1={y + Math.sin(a) * r * 0.35}
              x2={x + Math.cos(a) * r}
              y2={y + Math.sin(a) * r}
              opacity={0.4 + (i % 3) * 0.25}
            />
            <circle
              cx={x + Math.cos(a) * r * 1.12}
              cy={y + Math.sin(a) * r * 1.12}
              r=".7"
              fill={color}
            />
          </g>
        );
      })}
    </g>
  );
}
export default function FireworkPreview({ id, color = "#e7b668" }) {
  const uid = useId().replaceAll(":", ""),
    g = `body-${uid}`;
  return (
    <svg className="fw-preview" viewBox="0 0 140 100" aria-hidden="true">
      <defs>
        <linearGradient id={g}>
          <stop stopColor="#4b2536" />
          <stop offset=".45" stopColor={color} />
          <stop offset=".65" stopColor={color} />
          <stop offset="1" stopColor="#53363e" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop stopColor={color} stopOpacity=".2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="70" cy="64" rx="64" ry="36" fill={`url(#glow-${uid})`} />
      {(id === "rocket" || id === "whistle") && (
        <g
          transform={`translate(70 50) rotate(${id === "whistle" ? 24 : -20})`}
        >
          <path d="M-8-17L0-34 8-17" fill={color} />
          <rect
            x="-8"
            y="-17"
            width="16"
            height="38"
            rx="2"
            fill={`url(#${g})`}
          />
          <path d="M-8 9L-17 26-7 22M8 9L17 26 7 22" fill="#bd756c" />
          <path d="M-6-7h12M-6 6h12" stroke="#ffe5ac" strokeWidth="2" />
          <path d="M0 22v25" stroke="#c0915b" strokeWidth="2" />
          <path d="M-4 24Q-13 40 0 48Q13 40 4 24" fill="#ffb553" opacity=".8" />
          {id === "whistle" && (
            <path
              d="M16-20q15-10 5-20m5 28q23-13 9-27"
              fill="none"
              stroke="#d9b8fa"
              strokeWidth="1.2"
            />
          )}
        </g>
      )}
      {id === "sparkler" && (
        <g>
          <path d="M45 94L75 40" stroke="#8d8792" strokeWidth="3" />
          <path d="M65 58L80 30" stroke="#c6bc98" strokeWidth="5" />
          <Crown x={80} y={30} r={25} />
          <circle cx="80" cy="30" r="3" fill="#fff2b0" />
        </g>
      )}
      {(id === "fountain" || id === "color") && (
        <g>
          <path
            d="M70 45L47 86Q70 97 93 86Z"
            fill={`url(#${g})`}
            stroke="#cc9666"
          />
          <path d="M53 76h34M58 67h24" stroke="#f2cf85" strokeWidth="2" />
          {Array.from({ length: 19 }, (_, i) => (
            <path
              key={i}
              d={`M70 46Q${70 + (i - 9) * 3} ${-8 + (i % 4) * 6} ${70 + (i - 9) * 6} ${19 + (i % 5) * 6}`}
              fill="none"
              stroke={id === "color" ? PALETTE[i % 6] : color}
              strokeWidth="1"
              opacity=".8"
            />
          ))}
          <circle cx="70" cy="44" r="3" fill="#ffeab0" />
        </g>
      )}
      {id === "bomb" && (
        <g>
          <circle cx="67" cy="65" r="24" fill={`url(#${g})`} />
          <path
            d="M48 51L85 73M46 62l35 20M54 44l34 20M53 85L83 46M43 72L71 41"
            stroke="#c3ad73"
            strokeWidth="2"
            opacity=".8"
          />
          <path
            d="M69 41Q65 20 84 24"
            fill="none"
            stroke="#c1a77a"
            strokeWidth="3"
          />
          <Crown x={86} y={24} r={13} />
        </g>
      )}
      {id === "spinner" && (
        <g>
          <ellipse
            cx="70"
            cy="69"
            rx="27"
            ry="13"
            fill={`url(#${g})`}
            stroke="#e5b975"
          />
          <ellipse
            cx="70"
            cy="65"
            rx="22"
            ry="10"
            fill="none"
            stroke="#f0cd87"
          />
          <path
            d="M52 65q8-13 26-6t-8 13q-15-4-3-9"
            fill="none"
            stroke="#f0cd87"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M${70 + Math.cos(i) * 30} ${65 + Math.sin(i) * 15}q${Math.sin(i) * 12} ${Math.cos(i) * 14} ${Math.cos(i) * 16} ${Math.sin(i) * 14}`}
              stroke={color}
              fill="none"
              opacity=".7"
            />
          ))}
        </g>
      )}
      {id === "lantern" && (
        <g>
          <path
            d="M50 19Q70 11 90 19Q100 44 88 72Q70 82 52 72Q40 44 50 19"
            fill={`url(#${g})`}
            stroke="#edbb7a"
          />
          <path
            d="M59 19q-7 26 1 56M81 19q7 26-1 56M70 17v61"
            fill="none"
            stroke="#ffe2a677"
          />
          <ellipse cx="70" cy="75" rx="18" ry="5" fill="#8e442e" />
          <path d="M70 74Q57 65 71 51Q83 68 70 74" fill="#ffe4a3" />
        </g>
      )}
      {id === "ladi" && (
        <g transform="rotate(-18 70 50)">
          <path d="M18 50Q70 20 120 53" stroke="#bf8d6b" fill="none" />
          {Array.from({ length: 13 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${20 + i * 8} ${40 - Math.sin((i / 12) * Math.PI) * 10}) rotate(${i % 2 ? 16 : -16})`}
            >
              <rect
                width="6"
                height="23"
                rx="1"
                fill={i % 3 ? "#c45864" : "#d79669"}
              />
              <path d="M0 3h6M0 19h6" stroke="#efd39a" />
            </g>
          ))}
          <Crown x={122} y={51} r={14} />
        </g>
      )}
      {(id === "shell" || id === "multishot") && (
        <g>
          <rect
            x="52"
            y="68"
            width="36"
            height="26"
            rx="3"
            fill={`url(#${g})`}
          />
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx={58 + i * 12}
              cy="68"
              rx="5"
              ry="3"
              fill="#2f2134"
              stroke="#d7a47b"
            />
          ))}
          <Crown color={color} x={70} y={29} r={id === "shell" ? 29 : 19} />
          {id === "multishot" && (
            <>
              <Crown color="#ff92bb" x={29} y={43} r={15} />
              <Crown color="#98d9ef" x={111} y={39} r={18} />
            </>
          )}
        </g>
      )}
      {id === "rain" && (
        <g>
          {Array.from({ length: 30 }, (_, i) => (
            <path
              key={i}
              d={`M${12 + i * 4} ${12 + ((i * 7) % 27)}q-8 20 -4 ${28 + (i % 5) * 6}`}
              stroke={color}
              strokeWidth={i % 3 ? 1 : 2}
              fill="none"
              opacity={0.3 + (i % 4) * 0.2}
            />
          ))}
        </g>
      )}
      {id === "butterfly" && (
        <g>
          <path
            d="M69 53C15 1 13 62 64 61C20 97 62 98 70 63C79 98 120 97 76 61C127 62 127 1 71 53"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          <path d="M70 50v21" stroke="#f3d09d" strokeWidth="4" />
          <Crown x={35} y={42} r={14} color="#ffc1d8" />
          <Crown x={107} y={42} r={14} />
        </g>
      )}
      {id === "finale" && (
        <>
          <Crown x={70} y={30} r={26} color="#ffd68c" />
          <Crown x={29} y={53} r={23} color="#ff87b5" />
          <Crown x={111} y={50} r={23} color="#98d8ff" />
          <path
            d="M30 95Q20 70 30 58M70 95V49M110 95Q124 70 110 56"
            stroke="#d5b67b"
            fill="none"
            strokeDasharray="2 3"
          />
        </>
      )}
    </svg>
  );
}
