'use client';

import { useState, useEffect, useCallback } from 'react';

interface DateMonitoringResult {
  currentDate: Date;
  lastUpdateTime: Date | null;
  isNewDay: boolean;
  refreshDate: () => void;
}

export const useDateMonitoring = (): DateMonitoringResult => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isNewDay, setIsNewDay] = useState(false);

  const refreshDate = useCallback(() => {
    const now = new Date();
    const currentDateString = currentDate.toDateString();
    const nowDateString = now.toDateString();
    
    // Se a data mudou, atualizar
    if (currentDateString !== nowDateString) {
      console.log('📅 Data mudou! Atualizando para:', nowDateString);
      setCurrentDate(now);
      setLastUpdateTime(now);
      setIsNewDay(true);
      
      // Resetar flag após um tempo
      setTimeout(() => setIsNewDay(false), 5000);
    }
  }, [currentDate]);

  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const currentDateString = currentDate.toDateString();
      const nowDateString = now.toDateString();
      
      // Se a data mudou, atualizar
      if (currentDateString !== nowDateString) {
        console.log('📅 Data mudou! Atualizando para:', nowDateString);
        setCurrentDate(now);
        setLastUpdateTime(now);
        setIsNewDay(true);
        
        // Resetar flag após um tempo
        setTimeout(() => setIsNewDay(false), 5000);
      }
    };

    // Verificar a cada minuto se a data mudou
    const interval = setInterval(checkDateChange, 60000); // 60 segundos
    
    // Verificar imediatamente
    checkDateChange();
    
    return () => clearInterval(interval);
  }, [currentDate]);

  return {
    currentDate,
    lastUpdateTime,
    isNewDay,
    refreshDate
  };
};
