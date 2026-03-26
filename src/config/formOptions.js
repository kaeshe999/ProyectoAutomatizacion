// Opciones centralizadas para todos los dropdowns del formulario

export const REGIONES = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
];

export const INSTALADO_OPTIONS = ['Sí', 'No'];

export const MODULOS_OPTIONS = [
    '1 módulo',
    '2 módulos',
    '3 módulos',
    '4 módulos',
    '5 módulos'
];

export const ESTADO_LOCKER_OPTIONS = ['Daño visible', 'Sin comentarios'];

export const PRUEBAS_OPTIONS = ['Realizadas', 'No realizadas'];

export const RADIER_OPTIONS = ['Sin comentarios', 'Baja calidad'];

export const CONEXION_ELECTRICA_OPTIONS = [
    'Óptimo',
    'Problema Punto Red',
    'Problema punto eléctrico'
];

export const ENCHUFADO_OPTIONS = ['Sí', 'No'];

export const BASURA_OPTIONS = ['Sin comentarios', 'Basura en el lugar'];

// Campos del formulario con su configuración
export const FORM_FIELDS = [
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'eds', label: 'EDS (Código Sucursal)', type: 'text', required: true, placeholder: 'Ej: EDS-001' },
    { name: 'comuna', label: 'Comuna', type: 'text', required: true, placeholder: 'Ingrese la comuna' },
    { name: 'direccion', label: 'Dirección', type: 'text', required: true, placeholder: 'Dirección de la instalación' },
    { name: 'region', label: 'Región', type: 'select', required: true, options: REGIONES },
    { name: 'movil', label: 'Móvil', type: 'text', required: false, placeholder: 'Nombre de Instalador' },
    { name: 'codigoBlue', label: 'Código Blue', type: 'text', required: false, placeholder: 'Código Blue' },
    { name: 'instalado', label: 'Instalado', type: 'select', required: true, options: INSTALADO_OPTIONS },
    { name: 'modulosInstalados', label: 'Módulos Instalados', type: 'select', required: true, options: MODULOS_OPTIONS },
    { name: 'estadoLocker', label: 'Estado Locker', type: 'select', required: true, options: ESTADO_LOCKER_OPTIONS },
    { name: 'pruebas', label: 'Pruebas', type: 'select', required: true, options: PRUEBAS_OPTIONS },
    { name: 'radier', label: 'Radier', type: 'select', required: true, options: RADIER_OPTIONS },
    { name: 'conexionElectrica', label: 'Conexión Eléctrica', type: 'select', required: true, options: CONEXION_ELECTRICA_OPTIONS },
    { name: 'enchufado', label: 'Enchufado', type: 'select', required: true, options: ENCHUFADO_OPTIONS },
    { name: 'basura', label: 'Basura', type: 'select', required: true, options: BASURA_OPTIONS },
    { name: 'comentarios', label: 'Comentarios', type: 'textarea', required: false, placeholder: 'Observaciones adicionales...' }
];
