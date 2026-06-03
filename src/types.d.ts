declare module "lucide-react" {
  import { ComponentType, SVGProps } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    color?: string;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const Droplets: LucideIcon;
  export const Heart: LucideIcon;
  export const Truck: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Activity: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Users: LucideIcon;
  export const Baby: LucideIcon;
  export const BarChart3: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const Plus: LucideIcon;
  export const Mail: LucideIcon;
  export const Lock: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Bell: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const Download: LucideIcon;
  export const Printer: LucideIcon;
  export const Info: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Shield: LucideIcon;
  export const CircleCheckIcon: LucideIcon;
  export const InfoIcon: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const OctagonXIcon: LucideIcon;
  export const TriangleAlertIcon: LucideIcon;
  export const User: LucideIcon;

  // Catch-all for any icon not explicitly listed
  const icons: Record<string, LucideIcon>;
  export default icons;
}
