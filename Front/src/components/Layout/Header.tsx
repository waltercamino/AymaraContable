// src/components/Layout/Header.tsx
import { LogOut, User, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';

interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  rol_id: number;
}

interface HeaderProps {
  onLogout: () => void;
  usuario: Usuario | null;
}

export default function Header({ onLogout, usuario }: HeaderProps) {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { theme, toggleTheme } = useTheme();
  const [cajasAbiertasCount, setCajasAbiertasCount] = useState(0);

  // ✅ Detectar cajas abiertas pendientes del sessionStorage
  useEffect(() => {
    const cajasGuardadas = sessionStorage.getItem('cajas_abiertas_login');
    if (cajasGuardadas && cajasGuardadas !== 'undefined' && cajasGuardadas !== 'null') {
      try {
        const cajas = JSON.parse(cajasGuardadas);
        setCajasAbiertasCount(Array.isArray(cajas) ? cajas.length : 0);
      } catch (e) {
        console.error('Error parseando cajas abiertas:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      onLogout();
      navigate('/login');
    }
  };

  const nombreUsuario = usuario?.nombre_completo || usuario?.nombre || usuario?.username || 'Usuario';

  // ✅ Manejar click en alerta de cajas
  const handleCajasAlertClick = () => {
    navigate('/caja');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6">
      <div className="flex items-center gap-4">

        {/* Nombre de Empresa */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {config?.nombre_empresa || 'Sistema Contable'}
        </h1>

        {/* Logo */}
        {config?.logo_url && (
          <img
            src={`${import.meta.env.VITE_API_URL}${config.logo_url}`}
            alt="Logo"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              console.error('❌ Error cargando logo:', config.logo_url);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Toggle Dark/Light */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {theme === 'light' ? <Moon size={18} className="text-gray-600 dark:text-gray-300" /> : <Sun size={18} className="text-gray-600 dark:text-gray-300" />}
        </button>

        {/* 🔔 Alerta de Cajas Abiertas */}
        {cajasAbiertasCount > 0 && (
          <button
            onClick={handleCajasAlertClick}
            className="relative p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors animate-pulse"
            title={`Tenés ${cajasAbiertasCount} caja(s) abierta(s) - Click para ir a Caja`}
          >
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cajasAbiertasCount}
            </span>
          </button>
        )}

        {/* Usuario */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <User size={18} className="text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{nombreUsuario}</span>
        </div>

        {/* Salir */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
