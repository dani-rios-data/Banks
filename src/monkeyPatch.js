// Este archivo aplica monkey patching a los módulos problemáticos
import React from 'react';

// Reemplazamos la implementación de Spinner en @chakra-ui/icons
try {
  // Intentamos cargar el módulo problemático
  const iconsModule = require('@chakra-ui/icons/dist/esm/Spinner.mjs');
  
  // Si existe, reemplazamos la implementación de Spinner
  if (iconsModule) {
    // Creamos un componente personalizado con la misma API
    const CustomSpinner = React.forwardRef((props, ref) => {
      // Usamos el Spinner de Chakra UI directamente
      const { Spinner } = require('@chakra-ui/react');
      return <Spinner ref={ref} {...props} />;
    });
    
    // Añadimos displayName para React DevTools y para evitar warnings
    CustomSpinner.displayName = 'SpinnerIcon';
    
    // Reemplazamos el componente original
    iconsModule.Spinner = CustomSpinner;
    
    console.log('Monkey patch aplicado correctamente a @chakra-ui/icons/Spinner');
  }
} catch (error) {
  console.warn('No se pudo aplicar monkey patch a @chakra-ui/icons:', error.message);
} 