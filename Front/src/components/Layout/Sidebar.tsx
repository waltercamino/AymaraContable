// src/components/Layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Wallet,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { useState } from 'react';

// Props del Sidebar
interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void
}

// Tipo para los items del menú con submenús
interface SubMenuItem {
  title: string;
  path: string;
  disabled?: boolean;
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;  // Opcional, solo para Dashboard
  children?: SubMenuItem[];  // Submenús
}

// Estructura del menú reorganizada - Estructura Final Confirmada
const menuItems: MenuItem[] = [
  // 1° Dashboard (sin submenú)
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },

  // 2° Caja (Historial = pestaña interna)
  {
    title: 'Caja',
    icon: Wallet,
    children: [
      { title: 'Caja Diaria', path: '/caja' }
    ]
  },

  // 3° Ventas (FC Venta con modal Nuevo Cliente interno)
  {
    title: 'Ventas',
    icon: TrendingUp,
    children: [
      { title: 'FC Venta', path: '/fc-venta' }
    ]
  },

  // 4° Compras (FC Compra + Pedidos con modal Nuevo Proveedor)
  {
    title: 'Compras',
    icon: ShoppingCart,
    children: [
      { title: 'FC Compra', path: '/fc-compra' },
      { title: 'Pedidos', path: '/pedidos' }
    ]
  },

  // 5° Productos (2 tableros independientes)
  {
    title: 'Productos',
    icon: Package,
    children: [
      { title: 'Productos', path: '/productos' },
      { title: 'Precios', path: '/precios' }
    ]
  },

  // 6° Cta. Cte. (mismo tablero, filtro por tipo)
  { title: 'Cta. Cte.', icon: Users, path: '/cuenta-corriente' },

  // 7° Reportes (solo, sin submenús - todo en un tablero)
  { title: 'Reportes', icon: FileText, path: '/reportes' },

  // 8° Sistema (CRUD Clientes/Proveedores + Usuarios + Ajustes + Backup + Permisos)
  {
    title: 'Sistema',
    icon: Settings,
    children: [
      { title: 'Usuarios', path: '/usuarios' },
      { title: 'Clientes/Proveedores', path: '/clientes-proveedores' },
      { title: 'Ajustes', path: '/ajustes' },
      { title: 'Backup', path: '/backup' },
      { title: 'Matriz de Permisos', path: '/permisos-matriz' }
    ]
  }
];

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  // Manejar toggle y notificar al padre
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  // Toggle submenú
  const handleSubMenuToggle = (title: string) => {
    setOpenSubMenu(openSubMenu === title ? null : title);
  };

  return (
    <aside className={`bg-slate-800 text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header del Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed && <h1 className="text-xl font-bold truncate">Aymara Contable</h1>}
        <button
          onClick={handleToggle}
          className="p-2 rounded hover:bg-slate-700 transition-colors"
          aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.children && item.children.some(child => location.pathname === child.path));
            
            // Item sin submenú (Dashboard)
            if (!item.children) {
              return (
                <li key={item.title}>
                  <Link
                    to={item.path!}
                    className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                </li>
              );
            }
            
            // Item con submenú
            return (
              <li key={item.title}>
                <button
                  onClick={() => handleSubMenuToggle(item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${openSubMenu === item.title ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                
                {/* Submenú */}
                {!isCollapsed && openSubMenu === item.title && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      if (subItem.disabled) {
                        return (
                          <li key={subItem.path}>
                            <span
                              className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-500 cursor-not-allowed"
                              title="Próximamente"
                            >
                              <ChevronRight size={14} className="flex-shrink-0" />
                              <span className="truncate">{subItem.title} (Próximamente)</span>
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                              isSubActive
                                ? 'bg-blue-700 text-white'
                                : 'hover:bg-slate-600 text-slate-400'
                            }`}
                          >
                            <ChevronRight size={14} className="flex-shrink-0" />
                            <span className="truncate">{subItem.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}