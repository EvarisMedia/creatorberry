import { ThemeBackgroundDesign, BackgroundElement } from "./themeBackgrounds";

interface Props {
  design: ThemeBackgroundDesign;
  width: number;
  height: number;
}

function renderElement(el: BackgroundElement, index: number) {
  const posStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    ...el.position,
  };

  switch (el.type) {
    case "circle":
    case "rect":
      return (
        <div
          key={index}
          style={{
            ...posStyle,
            width: el.size.width,
            height: el.size.height,
            backgroundColor: el.color,
            opacity: el.opacity,
            borderRadius: el.borderRadius || (el.type === "circle" ? "50%" : undefined),
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        />
      );

    case "line":
    case "stripe":
      return (
        <div
          key={index}
          style={{
            ...posStyle,
            width: el.size.width,
            height: el.size.height,
            backgroundColor: el.color,
            opacity: el.opacity,
          }}
        />
      );

    case "gradient":
      return (
        <div
          key={index}
          style={{
            ...posStyle,
            width: el.size.width,
            height: el.size.height,
            background: el.gradient || `linear-gradient(180deg, ${el.color} 0%, transparent 100%)`,
            opacity: el.opacity,
          }}
        />
      );

    case "wave":
    case "blob":
      return (
        <svg
          key={index}
          style={{
            ...posStyle,
            width: el.size.width,
            height: el.size.height,
            overflow: "visible",
          }}
          viewBox={el.viewBox || "0 0 100 100"}
          preserveAspectRatio="none"
        >
          <path d={el.svgPath || ""} fill={el.color} opacity={el.opacity} />
        </svg>
      );

    case "dots": {
      // Render a repeating dot pattern using SVG
      const dotColor = el.color;
      const dotOpacity = el.opacity;
      return (
        <svg
          key={index}
          style={{
            ...posStyle,
            width: el.size.width,
            height: el.size.height,
          }}
        >
          <defs>
            <pattern id={`dots-${index}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill={dotColor} opacity={dotOpacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${index})`} />
        </svg>
      );
    }

    default:
      return null;
  }
}

export function PageBackgroundRenderer({ design }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {design.elements.map((el, i) => renderElement(el, i))}
    </div>
  );
}
