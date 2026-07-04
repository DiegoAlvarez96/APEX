# APEX Frontend UX Redesign

## Principios

- Mobile first: una mano, botones de 44 px o mas, navegacion inferior y bottom sheets.
- Inicio como hub: todos los modulos viven en una configuracion central (`lib/modules.ts`).
- Agenda como centro operativo: tocar un bloque abre un bottom sheet; tocar el titulo del sheet abre el modulo completo.
- IA integrada: acceso rapido desde inicio/header y superficies de recomendacion dentro de modulos existentes.
- UI utilitaria: contraste alto, pocas capas visuales, sombras suaves, componentes reutilizables.

## Wireframes

### Mobile

```text
+---------------------------+
| APEX Hoy        o o o o    |
|                           |
| Inicio                    |
|                           |
| [ Resumen inteligente   ] |
| [ Pedir ayuda a IA      ] |
|                           |
| [Agenda] [Skincare]       |
| [Nutri ] [Gym     ]       |
|                           |
| Stock                     |
| Compras                   |
| Chat IA                   |
| Ajustes                   |
|                           |
|   Agenda Care + Nutri Gym |
|           (+)             |
+---------------------------+
```

### Agenda con bottom sheet

```text
+---------------------------+
| Agenda APEX       <  >     |
| [Dia Semana Mes Timeline] |
| [ calendario compacto    ] |
| [ Skincare ][ Nutricion ] |
| [ Entreno  ][ Fisico    ] |
| [ Ahora 18:30           ] |
|                           |
| Bottom sheet              |
| Skincare              (x) |
| Abrir Skincare completo   |
| [ ] Limpieza              |
| [x] Serum                 |
+---------------------------+
```

### Desktop / Tablet

```text
+------------------------------------------------+
| APEX Hoy                         alert refresh |
|                                                |
|       Contenedor centrado max 3xl              |
|       mismas tarjetas responsive               |
|                                                |
|       bottom nav flotante centrado             |
+------------------------------------------------+
```

## Mockups de alta fidelidad

- Claro: fondo `#f5f5f7`, superficies blancas, texto `#14161a`, bordes `#dbdfe6`, acento lima sobrio.
- Oscuro: fondo `#090a0c`, superficies `#18191d` y `#202227`, texto `#f8fafc`, bordes `#373b43`.
- Mobile: grillas de dos columnas solo para acciones principales; listas simples para acciones secundarias.
- Tablet/Desktop: se conserva la misma jerarquia, con ancho ampliado (`lg:max-w-3xl`) sin crear otra app.

## Design System

### Tokens

- `--bg`: fondo base.
- `--surface`: cards, filas y controles.
- `--surface-strong`: nav, sheets y resumen destacado.
- `--text`: texto principal.
- `--muted`: etiquetas y metadata.
- `--border`: divisores sutiles.
- `--accent`: accion principal.
- `--accent-2`: IA, detalles secundarios.
- `--danger`: errores/criticidad.

### Componentes

- `Card`: superficie reutilizable con borde y sombra suave.
- `BottomSheet`: interaccion principal para detalles sin navegar.
- `SegmentedControl`: cambios de vista dia/semana/mes/timeline.
- `BottomNav`: cuatro modulos configurables mas boton central de inicio.
- `SettingRow`: filas compactas con switch estilo iPhone.
- `TaskList`: checklist reutilizable con targets tactiles comodos.

## Prototipo navegable implementado

- Inicio modular desde `components/cards/HomeView.tsx`.
- Navegacion inferior desde `components/layout/BottomNav.tsx`.
- Agenda con bottom sheets desde `components/cards/CalendarView.tsx`.
- Configuracion compacta desde `components/cards/SettingsView.tsx`.
- Tokens globales desde `app/globals.css` y `tailwind.config.ts`.

## Storyboard de video demostrativo

1. Abrir APEX en iPhone: aparece Inicio con resumen inteligente.
2. Tocar Agenda en nav inferior.
3. Cambiar entre Dia, Semana, Mes y Timeline.
4. Tocar Skincare: aparece bottom sheet.
5. Completar un checklist y tocar el titulo para abrir el modulo completo.
6. Volver a Inicio con el boton central.
7. Abrir Nutricion y registrar una comida desde el modulo existente.
8. Abrir Entrenamiento y generar rutina con IA desde el modulo existente.
9. Abrir Chat IA desde Inicio o header.
10. Abrir Compras y sincronizar lista inteligente.
11. Abrir Insights/Finanzas futuras desde la configuracion modular.
12. Abrir Configuracion, cambiar modo oscuro/claro y revisar modulos.

## Decision clave

El rediseño prioriza menos navegacion y mas contexto local: el usuario inspecciona y completa tareas desde sheets, y solo entra al modulo completo cuando necesita editar en profundidad.
