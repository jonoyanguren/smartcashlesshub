# Smart Cashless Hub - Style Guide

## Paleta de Colores

Inspirado en Revolut, Hubspot y Asana, con un enfoque premium y elegante.

### Colores Principales

- **Primary (Slate)**: Profesional y elegante
  - `primary-900`: #0f172a (Textos principales, fondos oscuros)
  - `primary-700`: #334155 (Textos secundarios)
  - `primary-500`: #64748b (Textos terciarios)
  - `primary-100`: #f1f5f9 (Fondos sutiles)

- **Accent (Violet)**: Premium y moderno
  - `accent-600`: #9333ea (Botones principales, acciones)
  - `accent-500`: #a855f7 (Hover states)
  - `accent-100`: #f3e8ff (Fondos de énfasis)

### Colores de Estado

- **Success**: `green-600` (#16a34a)
- **Warning**: `amber-600` (#d97706)
- **Error**: `red-600` (#dc2626)
- **Info**: `blue-600` (#2563eb)

### Neutros

- Uso de grays de Tailwind (50-950) para fondos, bordes y textos secundarios

## Tipografía

**Fuente**: Inter (Google Fonts)
- Display/Headings: Inter Bold/Semibold
- Body: Inter Regular/Medium
- Captions: Inter Regular

### Tamaños

```
h1: text-4xl font-bold (36px)
h2: text-3xl font-bold (30px)
h3: text-2xl font-semibold (24px)
h4: text-xl font-semibold (20px)
h5: text-lg font-semibold (18px)
body: text-base (16px)
small: text-sm (14px)
caption: text-xs (12px)
```

## Componentes

### Button

```tsx
import { Button } from '@/components/ui';

// Variantes
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Estados
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

### Card

```tsx
import { Card } from '@/components/ui';

// Variantes
<Card variant="elevated">Elevated (default)</Card>
<Card variant="outlined">Outlined</Card>
<Card variant="filled">Filled</Card>

// Padding
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding</Card>
<Card padding="lg">Large padding</Card>

// Interactivo
<Card hoverable>Hoverable Card</Card>
```

### Input

```tsx
import { Input } from '@/components/ui';

// Básico
<Input placeholder="Enter text..." />

// Con label
<Input label="Email" type="email" placeholder="you@example.com" />

// Con error
<Input label="Password" error="Password is required" />

// Con helper text
<Input label="Username" helperText="Choose a unique username" />

// Con iconos
<Input
  leftIcon={<MailIcon />}
  placeholder="Email"
/>

<Input
  rightIcon={<SearchIcon />}
  placeholder="Search..."
/>

// Full width
<Input fullWidth label="Full width input" />
```

### Table

```tsx
import { Table } from '@/components/ui';

const data = [
  { id: 1, name: 'Event 1', date: '2024-01-15', status: 'Active' },
  { id: 2, name: 'Event 2', date: '2024-02-20', status: 'Draft' },
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'date', header: 'Date' },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
        {item.status}
      </span>
    )
  },
];

<Table
  data={data}
  columns={columns}
  hoverable
  onRowClick={(item) => console.log(item)}
/>
```

## Espaciado

Usar sistema de spacing de Tailwind (múltiplos de 4px):

- `gap-1` = 4px
- `gap-2` = 8px
- `gap-4` = 16px
- `gap-6` = 24px
- `gap-8` = 32px

## Sombras

```css
.shadow-card        // Sombra sutil para cards
.shadow-soft        // Sombra suave en hover
.shadow-premium     // Sombra premium para destacar
```

## Bordes

- Border radius: `rounded-lg` (8px) para elementos pequeños
- Border radius: `rounded-xl` (12px) para cards
- Border radius: `rounded-2xl` (24px) para elementos grandes

## Efectos Premium

### Glass Morphism

```tsx
<div className="glass p-6">
  Glass effect content
</div>
```

### Gradientes

```tsx
<div className="gradient-primary p-6 text-white">
  Gradient background
</div>

<div className="gradient-premium p-6 text-white">
  Premium gradient
</div>
```

## Animaciones

```tsx
// Fade in
<div className="animate-fade-in">...</div>

// Slide up
<div className="animate-slide-up">...</div>

// Transitions
<button className="transition-all duration-200 hover:scale-105">
  Hover me
</button>
```

## Focus States

Todos los elementos interactivos deben usar `.focus-ring`:

```tsx
<button className="focus-ring">Accessible button</button>
```

## Responsive Design

Mobile-first approach:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // 1 columna en mobile, 2 en tablet, 3 en desktop
</div>
```

## Mejores Prácticas

1. **Consistencia**: Usar siempre los componentes base, no crear estilos ad-hoc
2. **Accesibilidad**: Incluir labels, focus states y ARIA attributes
3. **Responsive**: Pensar mobile-first
4. **Performance**: Usar lazy loading para imágenes y componentes pesados
5. **Spacing**: Mantener espaciado consistente con el sistema de Tailwind
6. **Tipografía**: Usar la jerarquía definida para headings
7. **Colores**: Limitarse a la paleta definida para coherencia visual