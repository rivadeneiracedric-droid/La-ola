import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExpedienteForm } from './components/ExpedienteForm';
import { FichaResumen } from './components/FichaResumen';
import { ExpedienteList } from './components/ExpedienteList';
import { GuiaReglasView } from './components/GuiaReglasView';
import { Expediente } from './types/expediente';
import { obtenerExpedientes } from './services/expedienteService';

type Vista = 'lista' | 'formulario' | 'ficha' | 'guia';

export default function App() {
  const [vista, setVista] = useState<Vista>('lista');
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<Expediente | null>(null);
  const [esRecienCreado, setEsRecienCreado] = useState<boolean>(false);
  
  // Control de sesión conforme a la regla 5.2
  // "Se registra a partir de la sesión autenticada cuando exista. 
  // Sin autenticación, no se inventa una identidad ni se presenta al responsable como creador verificado."
  const [sesionAutenticada, setSesionAutenticada] = useState<boolean>(false);
  const usuarioEmail = 'rivadeneiracedric@gmail.com';

  // Cargar expedientes persistidos al iniciar
  useEffect(() => {
    const listado = obtenerExpedientes();
    setExpedientes(listado);
  }, []);

  const handleNuevoExpediente = () => {
    setExpedienteSeleccionado(null);
    setEsRecienCreado(false);
    setVista('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExpedienteCreado = (nuevo: Expediente) => {
    // Actualizar lista
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
      {/* Barra de navegación superior (Contrato 3 zonas) */}
      <Header
        onNuevoExpediente={handleNuevoExpediente}
        sesionAutenticada={sesionAutenticada}
        onToggleSesion={handleToggleSesion}
        vistaActual={vista}
        onCambiarVista={handleCambiarVista}
      />

      {/* Contenido principal según el flujo de la Historia 5.1 */}
      <main className="flex-1">
        {vista === 'lista' && (
          <ExpedienteList
            expedientes={expedientes}
            onSeleccionarExpediente={handleSeleccionarExpediente}
            onNuevoExpediente={handleNuevoExpediente}
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
            esRecienCreado={esRecienCreado}
            onVolverALista={handleVolverALista}
            onCrearOtro={handleNuevoExpediente}
          />
        )}

        {vista === 'guia' && (
          <GuiaReglasView
            onVolver={handleVolverALista}
            onNuevoExpediente={handleNuevoExpediente}
          />
        )}
      </main>

      {/* Pie de página sobrio y profesional */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} IurisExpediente · MVP Legaltech para Despachos y Abogados</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Flujo 5.1: Formulario → Validación → Creación → Ficha Resumen</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => handleCambiarVista('guia')}
              className="hover:text-slate-900 underline transition-colors cursor-pointer"
            >
              Reglas 5.2 y 5.3
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
