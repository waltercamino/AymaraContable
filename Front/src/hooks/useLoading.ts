import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Hook reutilizable para manejar estado de loading y errores en peticiones asíncronas
 * @param action - Función asíncrona a ejecutar
 * @returns Objeto con loading, error, execute y resetError
 */
export const useLoading = <T extends (...args: any[]) => Promise<any>>(action: T) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: Parameters<T>): Promise<{ success: boolean; data?: Awaited<ReturnType<T>>; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await action(...args);
      // ✅ Toast automático para éxito
      toast.success('Operación exitosa');
      return { success: true, data: result };
    } catch (err: any) {
      const mensaje = err?.message || err?.error || 'Error desconocido';
      setError(mensaje);
      // ✅ Toast automático para error
      toast.error(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => setError(null);

  return { loading, error, execute, resetError };
};
