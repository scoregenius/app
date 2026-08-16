import React from "react";

/**
 * SCOREGENIUS lockup with the current app mark (arcs + ball + data point),
 * matching the marketing-site wordmark. The mark group is vertically centered
 * on the letterforms (letters span y 43.2–140.6, center ≈ 91.9); the header
 * renders on both light and dark grounds, so the ball and laces invert with
 * the theme (dark ball / white laces on light, white ball / dark laces on
 * dark) while the arcs and data point stay brand-constant.
 */
export default function LogoWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 1128.46 154.39"
      role="img"
      aria-labelledby="sgTitle sgDesc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="sgTitle">ScoreGenius logo word-mark</title>
      <desc id="sgDesc">
        Text “SCOREGENIUS” with an American-football icon between the words;
        emerald and orange arcs wrap the ball.
      </desc>
      {/* SCORE */}
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M35.34,140.64c-19.79,0-35.07-10.37-35.34-28.38h20.47c.55,7.64,5.59,12.69,14.46,12.69s14.33-4.78,14.33-11.6C49.26,92.75.14,105.16.27,70.64c0-17.19,13.92-27.56,33.57-27.56s32.89,9.96,34.11,27.16h-21.01c-.41-6.28-5.46-11.19-13.65-11.33-7.5-.27-13.1,3.41-13.1,11.19,0,19.1,48.85,8.46,48.85,42.03,0,15.01-12.01,28.52-33.7,28.52Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M129.22,43.21c21.15,0,38.34,11.33,44.76,30.84h-21.97c-4.5-9.14-12.69-13.65-22.92-13.65-16.65,0-28.52,12.14-28.52,31.52s11.87,31.52,28.52,31.52c10.23,0,18.42-4.5,22.92-13.78h21.97c-6.41,19.65-23.61,30.84-44.76,30.84-27.43,0-48.31-20.06-48.31-48.58s20.88-48.71,48.31-48.71Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M234.56,140.64c-26.88,0-48.85-20.2-48.85-48.85s21.97-48.72,48.85-48.72,48.71,20.2,48.71,48.72-21.7,48.85-48.71,48.85ZM234.56,123.59c17.19,0,29.06-12.42,29.06-31.79s-11.87-31.52-29.06-31.52-29.2,12.14-29.2,31.52,11.87,31.79,29.2,31.79Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M333.22,44.44c22.92,0,34.39,13.24,34.39,29.2,0,11.6-6.41,23.33-21.7,27.43l22.79,38.62h-22.11l-21.01-37.12h-9.01v37.12h-19.1V44.44h35.75ZM332.54,60.27h-15.97v27.97h15.97c10.64,0,15.42-5.59,15.42-14.19s-4.78-13.78-15.42-13.78Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M440.2,59.86h-36.16v23.88h32.07v15.15h-32.07v25.24h36.16v15.56h-55.26V44.3h55.26v15.56Z"
      />
      {/* Mark: green + orange arcs, ball, laces, data point */}
      <g transform="translate(547.90 91.86) scale(0.15992) translate(-10.18 6.36)">
        <g transform="rotate(-32)">
          <path
            d="M -319.5 85.5 A 340 250 0 0 0 319.5 85.5"
            fill="none"
            stroke="#00B140"
            strokeWidth={40}
            strokeLinecap="round"
          />
          <path
            d="M 319.5 -85.5 A 340 250 0 0 0 -319.5 -85.5"
            fill="none"
            stroke="#FF7F00"
            strokeWidth={40}
            strokeLinecap="round"
          />
          <path
            className="fill-[#0d1117] dark:fill-white"
            d="M -296 0 C -178 245 178 245 296 0 C 178 -245 -178 -245 -296 0 Z"
          />
          <g
            className="stroke-white dark:stroke-[#10161D]"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M -135 0 L 135 0" strokeWidth={24} />
            <path d="M -90 -40 L -90 40" strokeWidth={21} />
            <path d="M -30 -40 L -30 40" strokeWidth={21} />
            <path d="M 30 -40 L 30 40" strokeWidth={21} />
            <path d="M 90 -40 L 90 40" strokeWidth={21} />
          </g>
          <circle cx="319.5" cy="85.5" r="24" fill="#2ECC5E" />
          <circle cx="319.5" cy="85.5" r="10" fill="#E4FFEF" />
        </g>
      </g>
      {/* GENIUS */}
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M739.43,73.09h-21.97c-4.37-8.05-12.28-12.28-22.38-12.28-17.06,0-28.93,12.14-28.93,31.11s12.01,31.38,29.75,31.38c14.74,0,24.15-8.46,27.02-21.97h-32.75v-14.6h51.58v16.65c-3.82,19.38-21.15,37.12-46.53,37.12-27.7,0-48.71-20.06-48.71-48.58s21.01-48.71,48.58-48.71c21.29,0,38.21,10.78,44.35,29.88Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M811.21,59.85h-36.16v23.88h32.07v15.15h-32.07v25.24h36.16v15.56h-55.26V44.3h55.26v15.56Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M910,44.3v95.38h-19.1l-43.26-65.36v65.36h-19.1V44.3h19.1l43.26,65.5V44.3h19.1Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M928.83,44.43h19.1v95.25h-19.1V44.43Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M966.49,44.43h19.1v58.95c0,13.1,7.1,19.92,19.24,19.92s19.38-6.82,19.38-19.92v-58.95h19.24v58.81c0,25.11-18.01,37.39-38.89,37.39s-38.07-12.28-38.07-37.39v-58.81Z"
      />
      <path
        className="fill-[#0d1117] dark:fill-white"
        d="M1094.76,140.63c-19.79,0-35.07-10.37-35.34-28.38h20.47c.55,7.64,5.59,12.69,14.46,12.69s14.33-4.78,14.33-11.6c0-20.6-49.12-8.19-48.99-42.71,0-17.19,13.92-27.56,33.57-27.56s32.89,9.96,34.11,27.16h-21.01c-.41-6.28-5.46-11.19-13.65-11.33-7.51-.27-13.1,3.41-13.1,11.19,0,19.1,48.85,8.46,48.85,42.03,0,15.01-12.01,28.52-33.7,28.52Z"
      />
    </svg>
  );
}
