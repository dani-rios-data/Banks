# Banking Advertisement Dashboard

Un dashboard interactivo para analizar y visualizar datos de inversión publicitaria de los principales bancos, incluyendo Bank of America, Wells Fargo, TD Bank, Capital One y PNC Bank.

## Características

- 📊 Visualización de distribución de medios por banco
- 📈 Análisis de tendencias mensuales
- 🎯 Insights estratégicos por banco
- 🔄 Filtrado por períodos específicos
- 📱 Diseño responsivo
- 🎨 Esquemas de colores personalizados por banco

## Tecnologías Utilizadas

- React.js
- Recharts para visualizaciones
- Tailwind CSS para estilos
- Context API para manejo de estado

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/banking-ad-dashboard.git
cd banking-ad-dashboard
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

3. Crea un archivo `.env` en la raíz del proyecto y configura las variables de entorno necesarias:
```env
REACT_APP_API_URL=tu_url_api
```

4. Inicia el servidor de desarrollo:
```bash
npm start
# o
yarn start
```

## Estructura de Datos

El dashboard espera los siguientes archivos CSV en el directorio `/public/data/`:
- `wells-fargo-bank-benchmark-v3-1.csv`
- `td-bank-benchmark-v3.csv`
- `pnc-bank-benchmark-v3.csv`
- `capital-one-benchmark-v3.csv`
- `bank-of-america-benchmark-v2.csv`

## Despliegue

Este proyecto está configurado para ser desplegado en Vercel. Para desplegar:

1. Crea una cuenta en [Vercel](https://vercel.com)
2. Instala Vercel CLI:
```bash
npm i -g vercel
```

3. Despliega el proyecto:
```bash
vercel
```

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter)

Link del Proyecto: [https://github.com/tu-usuario/banking-ad-dashboard](https://github.com/tu-usuario/banking-ad-dashboard)
