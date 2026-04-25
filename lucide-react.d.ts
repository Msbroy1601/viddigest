declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  type Icon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  export const Youtube: Icon;
  export const Mic: Icon;
  export const FileText: Icon;
  export const Sparkles: Icon;
  export const ChevronDown: Icon;
}
