import type { SVGProps } from "react";

type SolidHealthIconName = "heart-pulse" | "circle-user" | "right-from-bracket";

type IconDefinition = {
  width: number;
  height: number;
  path: string;
};

/*
 * Icon data from Font Awesome Free by Fonticons, Inc.
 * The icons are licensed under CC BY 4.0 and the Font Awesome code under MIT.
 * Keeping the few paths used here local avoids depending on a global icon font.
 */
const ICONS: Record<SolidHealthIconName, IconDefinition> = {
  "heart-pulse": {
    width: 512,
    height: 512,
    path: "M256 107.9L241 87.1C216 52.5 175.9 32 133.1 32 59.6 32 0 91.6 0 165.1l0 2.6c0 23.6 6.2 48 16.6 72.3l106 0c3.2 0 6.1-1.9 7.4-4.9l31.8-76.3c3.7-8.8 12.3-14.6 21.8-14.8s18.3 5.4 22.2 14.1l51.3 113.9 41.4-82.8c4.1-8.1 12.4-13.3 21.5-13.3s17.4 5.1 21.5 13.3l23.2 46.3c1.4 2.7 4.1 4.4 7.2 4.4l123.6 0c10.5-24.3 16.6-48.7 16.6-72.3l0-2.6C512 91.6 452.4 32 378.9 32 336.2 32 296 52.5 271 87.1l-15 20.7zM469.6 288l-97.8 0c-21.2 0-40.6-12-50.1-31l-1.7-3.4-42.5 85.1c-4.1 8.3-12.7 13.5-22 13.3s-17.6-5.7-21.4-14.1l-49.3-109.5-10.5 25.2c-8.7 20.9-29.1 34.5-51.7 34.5l-80.2 0c47.2 73.8 123 141.7 170.4 177.9 12.4 9.4 27.6 14.1 43.1 14.1s30.8-4.6 43.1-14.1C346.6 429.7 422.4 361.8 469.6 288z",
  },
  "circle-user": {
    width: 512,
    height: 512,
    path: "M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2 35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z",
  },
  "right-from-bracket": {
    width: 512,
    height: 512,
    path: "M505 273c9.4-9.4 9.4-24.6 0-33.9L361 95c-6.9-6.9-17.2-8.9-26.2-5.2S320 102.3 320 112l0 80-112 0c-26.5 0-48 21.5-48 48l0 32c0 26.5 21.5 48 48 48l112 0 0 80c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2L505 273zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z",
  },
};

type FontAwesomeIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  icon: SolidHealthIconName;
};

export default function FontAwesomeIcon({
  icon,
  className = "",
  ...props
}: FontAwesomeIconProps) {
  const definition = ICONS[icon];
  const classes = `solid-health-fa-icon fa-solid fa-${icon}${className ? ` ${className}` : ""}`;

  return (
    <svg
      {...props}
      className={classes}
      viewBox={`0 0 ${definition.width} ${definition.height}`}
      width="1em"
      height="1em"
      fill="currentColor"
      focusable="false"
      aria-hidden={props["aria-hidden"] ?? true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={definition.path} />
    </svg>
  );
}
