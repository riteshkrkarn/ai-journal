import React from "react";

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = "h-7 w-7",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="7" className="fill-primary" />
    <rect x="7.5" y="7.5" width="4" height="17" rx="1.5" fill="#FFFFFF" />
    <path
      d="M14 7.5H20.5C22.7091 7.5 24.5 9.29086 24.5 11.5V16.25C24.5 18.4591 22.7091 20.25 20.5 20.25H17L14 23.75V7.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

const Logo: React.FC = () => (
  <div className="flex items-center gap-2.5">
    <BrandMark className="h-7 w-7 shrink-0" />
    <span className="font-display text-lg font-bold tracking-tight text-foreground">
      ReflectIQ
    </span>
  </div>
);

export default Logo;
