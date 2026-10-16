import type { SvgIconComponent } from "@mui/icons-material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import DirectionsRunOutlinedIcon from "@mui/icons-material/DirectionsRunOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import SelfImprovementOutlinedIcon from "@mui/icons-material/SelfImprovementOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";

/** El icono de cada categoría estándar, por su clave estable. Decorativo: el nombre siempre va escrito al lado. */
const CATEGORY_ICONS: Record<string, SvgIconComponent> = {
  economia: AccountBalanceWalletOutlinedIcon,
  vidaSocial: GroupsOutlinedIcon,
  pareja: FavoriteBorderOutlinedIcon,
  sexo: WhatshotOutlinedIcon,
  deporte: DirectionsRunOutlinedIcon,
  aventura: ExploreOutlinedIcon,
  espiritualidad: SelfImprovementOutlinedIcon,
  familia: FamilyRestroomOutlinedIcon,
  inversiones: TrendingUpOutlinedIcon,
  salud: HealthAndSafetyOutlinedIcon,
  tecnologia: DevicesOutlinedIcon,
};

/** Una categoría creada desde administración (sin clave) o sin icono propio lleva uno genérico. */
export function categoryIcon(key: string | undefined): SvgIconComponent {
  return (key && CATEGORY_ICONS[key]) || CategoryOutlinedIcon;
}
