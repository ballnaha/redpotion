# RedPotion Design System

## 🎨 Color Palette

### Primary Colors
- **Green Main**: `#4CAF50` - สีเขียวหลักของแบรนด์
- **Green Light**: `#81C784` - สีเขียวอ่อน
- **Green Dark**: `#388E3C` - สีเขียวเข้ม

### Secondary Colors
- **Secondary Main**: `#66BB6A` 
- **Secondary Light**: `#A5D6A7`
- **Secondary Dark**: `#4CAF50`

### Accent Colors
- **Success**: `#4CAF50`
- **Warning**: `#FF9800`
- **Error**: `#F44336`
- **Info**: `#2196F3`

### Background Colors
- **Default**: `#F8F9FA` - พื้นหลังหลัก
- **Paper**: `rgba(255, 255, 255, 0.9)` - พื้นหลัง component
- **Gradient Customer**: `linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)`

## 📱 Mobile-First Approach

### Breakpoints
```css
/* Mobile First */
@media (min-width: 600px) { /* Tablet */ }
@media (min-width: 960px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }
```

### Container Spacing
- **Mobile**: 16px padding
- **Tablet**: 20px padding  
- **Desktop**: 24px padding

## 🪟 Liquid Glass Design

### Glassmorphism Properties
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Navigation Glass
```css
.glass-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
```

## 📐 Layout Components

### Box vs Grid
- ใช้ **Box** แทน Grid เพื่อความกว้างเต็มพื้นที่
- Flex layout สำหรับ responsive design
- No Container - ใช้ full width approach

### Component Structure
```tsx
// ✅ ใช้ Box
<Box sx={{ width: '100%', p: 2 }}>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
    {/* Content */}
  </Box>
</Box>

// ❌ ไม่ใช้ Grid Container
<Container>
  <Grid container>
    {/* ไม่แนะนำ */}
  </Grid>
</Container>
```

## 🧩 Component Design

### Card Components
- **Border Radius**: 16px (theme.shape.borderRadius)
- **Glassmorphism effect** บน Card หลัก
- **Hover effects**: translateY(-2px)
- **Transition**: all 0.3s ease

### Button Design
- **Border Radius**: 12px
- **Text Transform**: none (ไม่ uppercase)
- **Font Weight**: 600
- **Padding**: 10px 24px
- **Box Shadow**: Subtle on hover

### Input Fields
- **Border Radius**: 12px
- **Background**: rgba(255, 255, 255, 0.8)
- **Focus State**: Full white background
- **No Border**: fieldset border none

## 📱 Navigation Design

### Top Navigation (Customer)
- **Profile Avatar**: 40x40px with border
- **Location Display**: "Deliver to" + location name
- **Icons**: Notifications & Shopping bag with badges
- **Search Bar**: Integrated in header
- **Background**: Linear gradient green

### Bottom Navigation
- **Height**: 56px
- **Icons**: Home, Search, Orders, Wishlist, Profile
- **Selected State**: Primary green color
- **Background**: Glass effect with blur

## 🏷️ Special Components

### Special Offers Card
- **Background**: Linear gradient green (`#4CAF50` to `#66BB6A`)
- **Text**: White color
- **Font**: Bold/900 weight for "30%"
- **Min Height**: 140px
- **Border Radius**: 16px

### Category Grid
- **Layout**: 4 columns (25% each)
- **Icon Background**: Colored squares (40x40px)
- **Border Radius**: 8px for icons
- **Spacing**: 16px gap
- **Text**: 0.7rem caption

### Product Cards
- **Min Width**: 160px for horizontal scroll
- **Promo Badge**: Absolute positioned, top-left
- **Add Button**: Absolute positioned, bottom-right
- **Image Height**: 100px
- **Border Radius**: 12px

## 🎯 UX Guidelines

### Touch Targets
- **Minimum**: 44px x 44px
- **Icons**: 20px-24px size
- **Buttons**: At least 48px height

### Spacing
- **Small**: 8px (1 unit)
- **Medium**: 16px (2 units)  
- **Large**: 24px (3 units)
- **XLarge**: 32px (4 units)

### Typography Scale
- **H4**: 1.5rem (mobile), 1.25rem responsive
- **H6**: 1.125rem (mobile), 1rem responsive
- **Body1**: 1rem (mobile), 0.875rem responsive
- **Caption**: 0.7rem for small text

## 🔧 Implementation Notes

### MUI Theme Overrides
```tsx
components: {
  MuiCard: {
    styleOverrides: {
      root: {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
    },
  },
}
```

### Hydration Prevention
```tsx
'use client';
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
```

### Responsive Utilities
- Use `theme.custom.mobileFirst.container.padding`
- Implement `hide-scrollbar` class for horizontal scrolls
- Add `safe-area-top/bottom` for mobile devices

## 📋 Checklist สำหรับ Component ใหม่

- [ ] ใช้ Box แทน Grid/Container
- [ ] เพิ่ม Glassmorphism effect
- [ ] Mobile-first responsive
- [ ] Touch-friendly sizing (44px min)
- [ ] Hover/Active states
- [ ] Accessibility (focus-visible)
- [ ] Loading states (skeleton)
- [ ] Error handling
- [ ] TypeScript types
- [ ] Prevent hydration issues 