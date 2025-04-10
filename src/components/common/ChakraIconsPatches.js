import React from 'react';
import { Spinner as ChakraSpinner } from '@chakra-ui/react';

// Este componente reemplaza el Spinner de @chakra-ui/icons
export const Spinner = React.forwardRef((props, ref) => {
  const { children, ...rest } = props;
  return <ChakraSpinner ref={ref} {...rest} />;
});

Spinner.displayName = 'Spinner';

// Exportamos también forwardRef para uso global
export const forwardRef = React.forwardRef; 