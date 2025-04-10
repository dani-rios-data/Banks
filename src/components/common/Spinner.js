import React from 'react';
import { Spinner as ChakraSpinner } from '@chakra-ui/react';

// Este componente es una envoltura para el Spinner de Chakra UI
// Se usa para reemplazar el componente problemático de @chakra-ui/icons
const Spinner = React.forwardRef((props, ref) => {
  return <ChakraSpinner ref={ref} {...props} />;
});

Spinner.displayName = 'Spinner';

// Exportar forwardRef para que se pueda usar en otros componentes
export const forwardRef = React.forwardRef;

// Exportar el componente Spinner como un componente nombrado
export { Spinner };

// También exportarlo como exportación por defecto para compatibilidad
export default Spinner; 