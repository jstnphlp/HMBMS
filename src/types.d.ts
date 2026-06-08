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
  export const Loader2: LucideIcon;
  export const Filter: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Phone: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
  export const FileText: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const Minus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Edit: LucideIcon;
  export const History: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Timer: LucideIcon;
  export const Inbox: LucideIcon;
  export const DollarSign: LucideIcon;
  export const CalendarCheck: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Syringe: LucideIcon;
  export const UserSearch: LucideIcon;
  export const QrCode: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Home: LucideIcon;
  export const UserX: LucideIcon;
  export const XCircle: LucideIcon;
  export const Clock: LucideIcon;
  export const Beaker: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Layers: LucideIcon;

  // Catch-all for any icon not explicitly listed
  const icons: Record<string, LucideIcon>;
  export default icons;
}
