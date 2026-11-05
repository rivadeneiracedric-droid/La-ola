import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ExpedienteForm } from './components/ExpedienteForm';
import { FichaResumen } from './components/FichaResumen';
import { ExpedienteList } from './components/ExpedienteList';
import { GuiaReglasView } from './components/GuiaReglasView';
import {
  Expediente,
  PlazoProcesal,
  ActuacionProcesal,
  TipoProcedimiento,
} from './types/expediente';
import {
  obtenerExpedientes,
  eliminarExpediente,
  eliminarTodosLosExpedientes,
  actualizarTipoProcesoExpediente,
  obtenerTodosLosPlazos,
  obtenerTodasLasActuaciones,
  ordenarPlazosCronologicamente,
  ordenarActuacionesDescendente,
} from './services/expedienteService';

type Vista = 'lista' | 'formulario' | 'ficha' | 'guia';

export default function App() {
  const [vista, setVista] = useState<Vista>('lista');
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [todosLosPlazos, setTodosLosPlazos] = useState<PlazoProcesal[]>([]);
  const [todasLasActuaciones, setTodasLasActuaciones] = useState<ActuacionProcesal[]>([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<Expediente | null>(null);
  const [esRecienCreado, setEsRecienCreado] = useState<boolean>(false);

  // Control de sesión conforme a HU-01
  const [sesionAutenticada, setSesionAutenticada] = useState<boolean>(false);
  const usuarioEmail = 'rivadeneiracedric@gmail.com';

  // Cargar expedientes, plazos y actuaciones persistidos al iniciar
  useEffect(() => {
    setExpedientes(obtenerExpedientes());
    setTodosLosPlazos(obtenerTodosLosPlazos());
    setTodasLasActuaciones(obtenerTodasLasActuaciones());
  }, []);

  const plazosExpedienteActivo = useMemo(() => {
    if (!expedienteSeleccionado) return [];
    return ordenarPlazosCronologicamente(
      todosLosPlazos.filter((p) => p.expedienteId === expedienteSeleccionado.id)
    );
  }, [todosLosPlazos, expedienteSeleccionado]);

  const actuacionesExpedienteActivo = useMemo(() => {
    if (!expedienteSeleccionado) return [];
    return ordenarActuacionesDescendente(
      todasLasActuaciones.filter((a) => a.expedienteId === expedienteSeleccionado.id)
    );
  }, [todasLasActuaciones, expedienteSeleccionado]);

  const handleNuevoExpediente = () => {
    setExpedienteSeleccionado(null);
    setEsRecienCreado(false);
    setVista('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExpedienteCreado = (nuevo: Expediente) => {
    setExpedientes((prev) => [nuevo, ...prev.filter((e) => e.id !== nuevo.id)]);
    setExpedienteSeleccionado(nuevo);
    setEsRecienCreado(true);
    setVista('ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeleccionarExpediente = (exp: Expediente) => {
    setExpedienteSeleccionado(exp);
    setEsRecienCreado(false);
    setVista('ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarExpediente = (id: string) => {
    const actualizados = eliminarExpediente(id);
    setExpedientes(actualizados);
    setTodosLosPlazos(obtenerTodosLosPlazos());
    setTodasLasActuaciones(obtenerTodasLasActuaciones());
    if (expedienteSeleccionado?.id === id) {
      setExpedienteSeleccionado(null);
      setEsRecienCreado(false);
      setVista('lista');
    }
  };

  const handleEliminarTodos = () => {
    const actualizados = eliminarTodosLosExpedientes();
    setExpedientes(actualizados);
    setTodosLosPlazos([]);
    setTodasLasActuaciones([]);
    setExpedienteSeleccionado(null);
    setEsRecienCreado(false);
    if (vista === 'ficha') {
      setVista('lista');
    }
  };

  const handlePlazosActualizados = (plazosExpediente: PlazoProcesal[]) => {
    if (!expedienteSeleccionado) return;
    setTodosLosPlazos((prev) => [
      ...prev.filter((p) => p.expedienteId !== expedienteSeleccionado.id),
      ...plazosExpediente,
    ]);
  };

  const handleActuacionesActualizadas = (actuacionesExpediente: ActuacionProcesal[]) => {
    if (!expedienteSeleccionado) return;
    setTodasLasActuaciones((prev) => [
      ...prev.filter((a) => a.expedienteId !== expedienteSeleccionado.id),
      ...actuacionesExpediente,
    ]);
  };

  const handleActualizarTipoProceso = (tipoProceso: TipoProcedimiento) => {
    if (!expedienteSeleccionado) return;
    const actualizados = actualizarTipoProcesoExpediente(
      expedienteSeleccionado.id,
      tipoProceso
    );
    setExpedientes(actualizados);
    setExpedienteSeleccionado((prev) =>
      prev && prev.id === expedienteSeleccionado.id ? { ...prev, tipoProceso } : prev
    );
  };

  const handleVolverALista = () => {
    setVista('lista');
    setExpedienteSeleccionado(null);
    setEsRecienCreado(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCambiarVista = (nuevaVista: 'lista' | 'guia') => {
    setVista(nuevaVista);
    setEsRecienCreado(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSesion = () => {
    setSesionAutenticada((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Barra de navegación superior */}
      <Header
        onNuevoExpediente={handleNuevoExpediente}
        sesionAutenticada={sesionAutenticada}
        onToggleSesion={handleToggleSesion}
        vistaActual={vista}
        onCambiarVista={handleCambiarVista}
      />

      {/* Contenido principal */}
      <main className="flex-1">
        {vista === 'lista' && (
          <ExpedienteList
            expedientes={expedientes}
            plazos={todosLosPlazos}
            actuaciones={todasLasActuaciones}
            onSeleccionarExpediente={handleSeleccionarExpediente}
            onNuevoExpediente={handleNuevoExpediente}
            onEliminarExpediente={handleEliminarExpediente}
            onEliminarTodos={handleEliminarTodos}
          />
        )}

        {vista === 'formulario' && (
          <ExpedienteForm
            onExpedienteCreado={handleExpedienteCreado}
            onCancelar={handleVolverALista}
            sesionAutenticada={sesionAutenticada}
            usuarioEmail={usuarioEmail}
          />
        )}

        {vista === 'ficha' && expedienteSeleccionado && (
          <FichaResumen
            expediente={expedienteSeleccionado}
            plazos={plazosExpedienteActivo}
            actuaciones={actuacionesExpedienteActivo}
            onPlazosActualizados={handlePlazosActualizados}
            onActuacionesActualizadas={handleActuacionesActualizadas}
            onActualizarTipoProceso={handleActualizarTipoProceso}
            esRecienCreado={esRecienCreado}
            onVolverALista={handleVolverALista}
            onCrearOtro={handleNuevoExpediente}
            onEliminarExpediente={handleEliminarExpediente}
          />
        )}

        {vista === 'guia' && (
          <GuiaReglasView
            onVolver={handleVolverALista}
            onNuevoExpediente={handleNuevoExpediente}
          />
        )}
      </main>

      {/* Pie de página */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} EXP-Legal (La Ola) · Plataforma Legaltech</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>HU-01 Expedientes · HU-02 Plazos Procesales · HU-03 Actuaciones</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleCambiarVista('guia')}
              className="hover:text-slate-900 underline transition-colors cursor-pointer"
            >
              Especificaciones
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
