import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from './context/ConfigContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import Caja from './pages/Caja'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import Precios from './pages/Precios'
import FCCompra from './pages/FCCompra'
import FCVenta from './pages/FCVenta'
import CuentaCorriente from './pages/CuentaCorriente'
import Pedidos from './pages/Pedidos'
import ClientesProveedores from './pages/ClientesProveedores'
import Ajustes from './pages/Ajustes'
import Backup from './pages/Backup'
import { PermisosMatriz } from './pages/PermisosMatriz'

function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="productos" element={<Productos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="caja" element={<Caja />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="precios" element={<Precios />} />
            <Route path="fc-compra" element={<FCCompra />} />
            <Route path="fc-venta" element={<FCVenta />} />
            <Route path="cuenta-corriente" element={<CuentaCorriente />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="clientes-proveedores" element={<ClientesProveedores />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="backup" element={<Backup />} />
            <Route path="permisos-matriz" element={<PermisosMatriz />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ConfigProvider>
  )
}

export default App