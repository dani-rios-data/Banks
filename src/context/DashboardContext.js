import React, { createContext, useContext, useState, useEffect } from 'react';
import { processData } from '../utils/dataProcessor';
import { 
  DEFAULT_ACTIVE_TAB, 
  DEFAULT_ACTIVE_MEDIA_TAB, 
  DEFAULT_FOCUSED_BANK, 
  DEFAULT_MEDIA_CATEGORY 
} from '../utils/constants';

// Valores por defecto para el estado inicial
const DEFAULT_DASHBOARD_DATA = {
  banks: [],
  monthlyTrends: [],
  mediaCategories: [],
  sortedMonthData: []
};

// Crear el contexto
const DashboardContext = createContext();

// Hook personalizado para usar el contexto
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe ser usado dentro de un DashboardProvider');
  }
  return context;
};

// Proveedor del contexto
export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB);
  const [activeMediaTab, setActiveMediaTab] = useState(DEFAULT_ACTIVE_MEDIA_TAB);
  const [focusedBank, setFocusedBank] = useState('All');
  const [selectedMediaCategory, setSelectedMediaCategory] = useState(DEFAULT_MEDIA_CATEGORY);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [tempSelectedMonths, setTempSelectedMonths] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Cargar datos principales del dashboard
        const response = await fetch('/processed/dashboard-data.json');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos del dashboard');
        }
        
        const data = await response.json();
        
        // Cargar datos complementarios por banco para enriquecer la visualización
        try {
          // Intentar cargar datos de Wells Fargo
          const wfResponse = await fetch('/processed/wells-fargo-performance.json');
          if (wfResponse.ok) {
            const wfData = await wfResponse.json();
            // Enriquecer datos de Wells Fargo con información detallada
            const wfBank = data.banks.find(bank => bank.name === 'Wells Fargo Bank');
            if (wfBank) {
              wfBank.detailedPerformance = wfData;
            }
          }
          
          // Intentar cargar datos de Bank of America
          const boaResponse = await fetch('/processed/bank-of-america-performance.json');
          if (boaResponse.ok) {
            const boaData = await boaResponse.json();
            const boaBank = data.banks.find(bank => bank.name === 'Bank of America');
            if (boaBank) {
              boaBank.detailedPerformance = boaData;
            }
          }
          
          // Intentar cargar datos de TD Bank
          const tdResponse = await fetch('/processed/td-bank-performance.json');
          if (tdResponse.ok) {
            const tdData = await tdResponse.json();
            const tdBank = data.banks.find(bank => bank.name === 'TD Bank');
            if (tdBank) {
              tdBank.detailedPerformance = tdData;
            }
          }
          
          // Intentar cargar datos de Capital One
          const capOneResponse = await fetch('/processed/capital-one-performance.json');
          if (capOneResponse.ok) {
            const capOneData = await capOneResponse.json();
            const capOneBank = data.banks.find(bank => bank.name === 'Capital One');
            if (capOneBank) {
              capOneBank.detailedPerformance = capOneData;
            }
          }
          
          // Intentar cargar datos de PNC Bank
          const pncResponse = await fetch('/processed/pnc-bank-performance.json');
          if (pncResponse.ok) {
            const pncData = await pncResponse.json();
            const pncBank = data.banks.find(bank => bank.name === 'PNC Bank');
            if (pncBank) {
              pncBank.detailedPerformance = pncData;
            }
          }
        } catch (detailError) {
          console.warn('No se pudieron cargar algunos datos detallados:', detailError);
          // Continuar con los datos principales aunque fallen los detalles
        }
        
        // Asegurar que los datos mensuales tengan el formato correcto
        if (data.monthlyTrends) {
          // Ordenar cronológicamente
          data.monthlyTrends.sort((a, b) => {
            const [yearA, monthA] = a.month.split('-');
            const [yearB, monthB] = b.month.split('-');
            return (parseInt(yearA) * 100 + parseInt(monthA)) - (parseInt(yearB) * 100 + parseInt(monthB));
          });
          
          // Calcular datos adicionales para cada mes
          data.monthlyTrends = data.monthlyTrends.map(month => {
            let total = 0;
            const bankShares = month.bankShares.map(share => {
              total += share.investment;
              return share;
            });
            
            // Calcular porcentajes de mercado
            const sharesWithPercentage = bankShares.map(share => ({
              ...share,
              percentage: total > 0 ? (share.investment / total) * 100 : 0
            }));
            
            return {
              ...month,
              total,
              bankShares: sharesWithPercentage
            };
          });
        }
        
        setDashboardData(data);
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Objeto de valor que se proporcionará a los consumidores del contexto
  const value = {
    // Datos y estado
    dashboardData,
    loading,
    error,
    
    // Estado de navegación
    activeTab,
    setActiveTab,
    activeMediaTab,
    setActiveMediaTab,
    
    // Filtros
    focusedBank,
    setFocusedBank,
    selectedMediaCategory,
    setSelectedMediaCategory,
    
    // Filtro de meses
    selectedMonths,
    setSelectedMonths,
    showMonthFilter,
    setShowMonthFilter,
    tempSelectedMonths,
    setTempSelectedMonths
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};