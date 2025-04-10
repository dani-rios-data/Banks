const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Añadimos una resolución de alias para forwardRef
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Redirigimos las importaciones de forwardRef al archivo de parche
        '@chakra-ui/react': path.resolve(__dirname, 'node_modules/@chakra-ui/react'),
        // Sobreescribe el archivo Spinner.mjs
        '@chakra-ui/icons/dist/esm/Spinner.mjs': path.resolve(__dirname, 'src/components/common/Spinner.js'),
      };
      
      return webpackConfig;
    },
  },
}; 