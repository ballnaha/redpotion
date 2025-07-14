'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  Chip,
  Grid,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  useMediaQuery,
  Skeleton,
  Stack
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Restaurant,
  Category as CategoryIcon,
  Visibility,
  VisibilityOff,
  Upload,
  Save,
  Cancel,
  LocalOffer,
  Close,
  Star,
  LocalFireDepartment,
  FiberNew,
  Whatshot,
  CalendarToday,
  DateRange
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ImageUploadDropzone, { uploadImageFile } from '../components/ImageUploadDropzone';
import { useNotification } from '../../../contexts/NotificationContext';

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    menuItems: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  calories?: number;
  tags?: string[];
  categoryId: string;
  category?: Category;
  addons?: Addon[];
}

interface Addon {
  id?: string;
  name: string;
  price: number;
  isAvailable: boolean;
  sortOrder?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`menu-tabpanel-${index}`}
      aria-labelledby={`menu-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MenuManagementPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Global notification
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Loading states for buttons
  const [categoryModalLoading, setCategoryModalLoading] = useState<string | null>(null); // categoryId being processed
  const [menuItemModalLoading, setMenuItemModalLoading] = useState<string | null>(null); // menuItemId being processed
  const [deletingId, setDeletingId] = useState<string | null>(null); // id being deleted

  // Category Modal States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  });
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [lastCategorySubmitTime, setLastCategorySubmitTime] = useState<number>(0);

  // MenuItem Modal States
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    imageUrl: '',
    isAvailable: true,
    calories: 0,
    tags: [] as string[],
    categoryId: '',
    addons: [] as Addon[]
  });
  const [menuItemImageFile, setMenuItemImageFile] = useState<File | null>(null);
  const [menuItemSaving, setMenuItemSaving] = useState(false);
  const [lastMenuSubmitTime, setLastMenuSubmitTime] = useState<number>(0);

  // Addon Management States
  const [newAddon, setNewAddon] = useState<Addon>({
    name: '',
    price: 0,
    isAvailable: true
  });
  const [editingAddon, setEditingAddon] = useState<{ addon: Addon; index: number } | null>(null);

  // Confirmation Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'menuItem';
    id: string;
    name: string;
    details?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant data
      const restaurantResponse = await fetch('/api/restaurant/my-restaurant');
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        setRestaurant(restaurantData);
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/restaurant/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Fetch menu items
      const menuItemsResponse = await fetch('/api/restaurant/menu-items');
      if (menuItemsResponse.ok) {
        const menuItemsData = await menuItemsResponse.json();
        setMenuItems(menuItemsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // แทนที่ด้วย global notification functions
  // showSuccess, showError, showWarning, showInfo จะใช้แทน showSnackbar

  // Confirmation Modal Functions
  const openDeleteConfirm = (type: 'category' | 'menuItem', id: string, name: string, details?: string) => {
    setDeleteTarget({ type, id, name, details });
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (!deleting) {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeletingId(deleteTarget.id);

      if (deleteTarget.id === 'close-category') {
        // ปิด category โดยการเซฟ form ต่อ
        await performSaveCategory();
        showSuccess('ปิดการใช้งานหมวดหมู่สำเร็จ');
        setCategoryModalOpen(false);
      } else if (deleteTarget.type === 'category') {
        const result = await performDeleteCategory(deleteTarget.id);
        const menuCount = (result as any)?.deletedMenuItems || 0;
        const imageCount = (result as any)?.deletedImages || 0;
        
        let message = 'ลบหมวดหมู่สำเร็จ';
        if (menuCount > 0) {
          message += ` (รวมเมนู ${menuCount} รายการ`;
          if (imageCount > 0) {
            message += ` และรูปภาพ ${imageCount} ไฟล์`;
          }
          message += ')';
        }
        
        showSuccess(message);
      } else if (deleteTarget.type === 'menuItem') {
        await performDeleteMenuItem(deleteTarget.id);
        showSuccess('ลบเมนูสำเร็จ');
      }

      closeDeleteConfirm();
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      showError(`ไม่สามารถ${deleteTarget.id === 'close-category' ? 'ปิดการใช้งาน' : 'ลบ'}${deleteTarget.type === 'category' ? 'หมวดหมู่' : 'เมนู'}ได้`);
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  // Category Functions
  const openCategoryModal = async (category?: Category) => {
    if (category) {
      setCategoryModalLoading(category.id);
      showInfo('กำลังเตรียมข้อมูล...');
      
      // จำลอง loading time
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        isActive: category.isActive
      });
      setCategoryModalLoading(null);
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        imageUrl: '',
        isActive: true
      });
    }
    setCategoryImageFile(null);
    setLastCategorySubmitTime(0); // รีเซ็ต debounce timer
    setCategoryModalOpen(true);
  };

  const handleCategoryImageChange = (imageUrl: string | null, file?: File) => {
    setCategoryForm(prev => ({
      ...prev,
      imageUrl: imageUrl || ''
    }));
    setCategoryImageFile(file || null);
  };

  // Perform save category (without confirmation)
  const performSaveCategory = async () => {
    let uploadedImageUrl = categoryForm.imageUrl;

    // Upload image if new file is selected
    if (categoryImageFile && restaurant?.id) {
      try {
        uploadedImageUrl = await uploadImageFile(
          categoryImageFile,
          restaurant.id,
          'menu',
          'category'
        );
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }
    }

    const url = editingCategory 
      ? `/api/restaurant/categories/${editingCategory.id}`
      : '/api/restaurant/categories';

    const method = editingCategory ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        imageUrl: uploadedImageUrl || null,
        isActive: categoryForm.isActive
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'เกิดข้อผิดพลาด');
    }
  };

  const saveCategoryData = async () => {
    // ป้องกันการกดซ้ำด้วย debounce (1 วินาที)
    const now = Date.now()
    if (categorySaving || (now - lastCategorySubmitTime < 1000)) {
      console.log('⚠️ saveCategoryData blocked: saving or too soon after last submit')
      return
    }

    setCategorySaving(true);
    setLastCategorySubmitTime(now);

    try {
      if (!categoryForm.name.trim()) {
        showError('กรุณากรอกชื่อหมวดหมู่');
        return;
      }

      // ตรวจสอบการปิด category ที่มีเมนู
      if (editingCategory && editingCategory.isActive && !categoryForm.isActive) {
        const menuCount = editingCategory._count?.menuItems || 0;
        if (menuCount > 0) {
          // แจ้งเตือนก่อนเปิด dialog
          showWarning(`หมวดหมู่นี้มีเมนูอาหาร ${menuCount} รายการ กรุณายืนยันการปิดการใช้งาน`);
          // ใช้ Dialog แทน confirm() สำหรับการปิด category ที่มีเมนู
          setDeleteTarget({
            type: 'category',
            id: 'close-category',
            name: editingCategory.name,
            details: `หมวดหมู่นี้มีเมนูอาหาร ${menuCount} รายการ เมื่อปิดการใช้งาน ลูกค้าจะไม่เห็นหมวดหมู่และเมนูทั้งหมด แต่ข้อมูลจะไม่หายไป`
          });
          setDeleteConfirmOpen(true);
          setCategorySaving(false);
          return;
        }
      }
      showInfo('กำลังบันทึกข้อมูลหมวดหมู่...');
      await performSaveCategory();
      showSuccess(editingCategory ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ');
      setCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('❌ Category submit error:', error);
      showError(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
      // รีเซ็ต debounce timer เมื่อเกิด error เพื่อให้สามารถลองใหม่ได้
      setLastCategorySubmitTime(0);
    } finally {
      setCategorySaving(false);
    }
  };

  // Perform delete functions (without UI confirmation)
  const performDeleteCategory = async (categoryId: string) => {
    const response = await fetch(`/api/restaurant/categories/${categoryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ไม่สามารถลบหมวดหมู่ได้');
    }

    const result = await response.json();
    return result;
  };

  const deleteCategory = (categoryId: string, categoryName: string, menuCount: number) => {
    if (deletingId === categoryId) return; // ป้องกันการคลิกซ้ำ
    
    const details = menuCount > 0 
      ? `⚠️ หมวดหมู่นี้มีเมนูอาหาร ${menuCount} รายการ การลบจะทำให้เมนูอาหารทั้งหมดในหมวดหมู่นี้ถูกลบไปด้วย และไม่สามารถเรียกคืนได้`
      : undefined;
    
    openDeleteConfirm('category', categoryId, categoryName, details);
  };

  // MenuItem Functions
  const openMenuItemModal = async (menuItem?: MenuItem) => {
    if (menuItem) {
      setMenuItemModalLoading(menuItem.id);
      showInfo('กำลังโหลดข้อมูลเมนู...');
      
      setEditingMenuItem(menuItem);
      setMenuItemForm({
        name: menuItem.name,
        description: menuItem.description || '',
        price: menuItem.price,
        originalPrice: menuItem.originalPrice || 0,
        imageUrl: menuItem.imageUrl || '',
        isAvailable: menuItem.isAvailable,
        calories: menuItem.calories || 0,
        tags: menuItem.tags || [],
        categoryId: menuItem.categoryId,
        addons: []
      });

      // โหลด add-ons ของ menu item นี้
      try {
        const response = await fetch(`/api/restaurant/menu-items/${menuItem.id}/addons`);
        if (response.ok) {
          const addons = await response.json();
          setMenuItemForm(prev => ({ ...prev, addons }));
        }
      } catch (error) {
        console.error('Error loading addons:', error);
      }
      
      // จำลอง loading time
      await new Promise(resolve => setTimeout(resolve, 700));
      setMenuItemModalLoading(null);
    } else {
      setEditingMenuItem(null);
      setMenuItemForm({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        imageUrl: '',
        isAvailable: true,
        calories: 0,
        tags: [],
        categoryId: categories.length > 0 ? categories[0].id : '',
        addons: []
      });
    }
    setMenuItemImageFile(null);
    setNewAddon({ name: '', price: 0, isAvailable: true });
    setEditingAddon(null);
    setLastMenuSubmitTime(0); // รีเซ็ต debounce timer
    setMenuItemModalOpen(true);
  };

  const handleMenuItemImageChange = (imageUrl: string | null, file?: File) => {
    setMenuItemForm(prev => ({
      ...prev,
      imageUrl: imageUrl || ''
    }));
    setMenuItemImageFile(file || null);
  };

  // Addon Management Functions
  const addAddonToForm = () => {
    if (!newAddon.name.trim() || newAddon.price <= 0) {
      showError('กรุณากรอกชื่อและราคา Add-on');
      return;
    }

    if (editingAddon) {
      // แก้ไข add-on ที่มีอยู่
      setMenuItemForm(prev => ({
        ...prev,
        addons: prev.addons.map((addon, index) => 
          index === editingAddon.index 
            ? { ...newAddon, name: newAddon.name.trim() }
            : addon
        )
      }));
      setEditingAddon(null);
    } else {
      // เพิ่ม add-on ใหม่
      setMenuItemForm(prev => ({
        ...prev,
        addons: [...prev.addons, { ...newAddon, name: newAddon.name.trim() }]
      }));
    }

    setNewAddon({ name: '', price: 0, isAvailable: true });
  };

  const editAddonInForm = (addon: Addon, index: number) => {
    setNewAddon({ ...addon });
    setEditingAddon({ addon, index });
  };

  const cancelEditAddon = () => {
    setNewAddon({ name: '', price: 0, isAvailable: true });
    setEditingAddon(null);
  };

  // Tags Management Functions
  const handleTagToggle = (tag: string) => {
    setMenuItemForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Available tags with icons and labels
  const availableTags = [
          { value: 'recommended', label: 'เมนูแนะนำ', icon: <Star />, color: '#fbbf24' },
      { value: 'bestseller', label: 'ขายดี', icon: <LocalFireDepartment />, color: '#f97316' },
      { value: 'new', label: 'เมนูใหม่', icon: <FiberNew />, color: '#06b6d4' } ,
      { value: 'promotion', label: 'โปรโมชั่น', icon: <LocalOffer />, color: '#dc2626' },
      { value: 'weekly-course', label: 'คอร์สรายอาทิตย์', icon: <CalendarToday />, color: '#6366f1' },
      { value: 'monthly-course', label: 'คอร์สรายเดือน', icon: <DateRange />, color: '#8b5a87' }
  ];

  const removeAddonFromForm = (index: number) => {
    setMenuItemForm(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
    
    // ถ้ากำลังแก้ไข add-on ที่ถูกลบ ให้ยกเลิกการแก้ไข
    if (editingAddon && editingAddon.index === index) {
      cancelEditAddon();
    }
  };

  const saveMenuItemData = async () => {
    // ป้องกันการกดซ้ำด้วย debounce (1 วินาที)
    const now = Date.now()
    if (menuItemSaving || (now - lastMenuSubmitTime < 1000)) {
      console.log('⚠️ saveMenuItemData blocked: saving or too soon after last submit')
      return
    }

    setMenuItemSaving(true);
    setLastMenuSubmitTime(now);

    try {
      if (!menuItemForm.name.trim()) {
        showError('กรุณากรอกชื่อเมนู');
        return;
      }

      if (!menuItemForm.categoryId) {
        showError('กรุณาเลือกหมวดหมู่');
        return;
      }

      if (menuItemForm.price <= 0) {
        showError('กรุณากรอกราคาที่ถูกต้อง');
        return;
      }
      showInfo('กำลังบันทึกข้อมูลเมนู...');
      
      let uploadedImageUrl = menuItemForm.imageUrl;

      // Upload image if new file is selected
      if (menuItemImageFile && restaurant?.id) {
        try {
          uploadedImageUrl = await uploadImageFile(
            menuItemImageFile,
            restaurant.id,
            'menu',
            'item'
          );
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          showError('ไม่สามารถอัปโหลดรูปภาพได้');
          setMenuItemSaving(false);
          return;
        }
      }

      const url = editingMenuItem 
        ? `/api/restaurant/menu-items/${editingMenuItem.id}`
        : '/api/restaurant/menu-items';

      const method = editingMenuItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: menuItemForm.name.trim(),
          description: menuItemForm.description.trim() || null,
          price: Number(menuItemForm.price),
          originalPrice: menuItemForm.originalPrice > 0 ? Number(menuItemForm.originalPrice) : null,
          imageUrl: uploadedImageUrl || null,
          isAvailable: menuItemForm.isAvailable,
          calories: menuItemForm.calories > 0 ? Number(menuItemForm.calories) : null,
          tags: menuItemForm.tags,
          categoryId: menuItemForm.categoryId,
          addons: menuItemForm.addons
        }),
      });

      if (response.ok) {
        showSuccess(editingMenuItem ? 'แก้ไขเมนูสำเร็จ' : 'เพิ่มเมนูสำเร็จ');
        setMenuItemModalOpen(false);
        fetchData();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('❌ Menu item submit error:', error);
      showError('ไม่สามารถบันทึกข้อมูลได้');
      // รีเซ็ต debounce timer เมื่อเกิด error เพื่อให้สามารถลองใหม่ได้
      setLastMenuSubmitTime(0);
    } finally {
      setMenuItemSaving(false);
    }
  };

  const performDeleteMenuItem = async (menuItemId: string) => {
    const response = await fetch(`/api/restaurant/menu-items/${menuItemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ไม่สามารถลบเมนูได้');
    }
  };

  const deleteMenuItem = (menuItemId: string, menuItemName: string) => {
    if (deletingId === menuItemId) return; // ป้องกันการคลิกซ้ำ
    
    openDeleteConfirm('menuItem', menuItemId, menuItemName);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Skeleton variant="text" width={120} height={48} />
            <Skeleton variant="text" width={120} height={48} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <Skeleton variant="rectangular" height={160} />
              <CardContent>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* Global Notification จะแสดงผ่าน NotificationProvider แล้ว */}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label={`หมวดหมู่ (${categories.filter(c => c.isActive).length}/${categories.length})`} 
            icon={<CategoryIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`เมนูอาหาร (${menuItems.length})`} 
            icon={<Restaurant />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            หมวดหมู่อาหาร
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openCategoryModal()}
            disabled={!!categoryModalLoading || !!deletingId}
          >
            เพิ่มหมวดหมู่
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {categories.map((category) => (
            <Card key={category.id} sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              opacity: category.isActive ? 1 : 0.7,
              border: !category.isActive ? `1px solid ${theme.palette.error.light}` : 'none',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}>
              {category.imageUrl && (
                <Box
                  component="img"
                  src={category.imageUrl}
                  alt={category.name}
                  sx={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover'
                  }}
                />
              )}
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      {!category.isActive && (
                        <Chip 
                          label="ปิด" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'error.main', 
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }} 
                        />
                      )}
                    </Box>
                    {!category.isActive && (
                      <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic' }}>
                        ลูกค้าไม่เห็นหมวดหมู่นี้
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                    <Tooltip title="แก้ไขหมวดหมู่" arrow placement="top">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={!isMobile && (categoryModalLoading === category.id ? <CircularProgress size={16} /> : <Edit />)}
                        onClick={() => openCategoryModal(category)}
                        disabled={categoryModalLoading === category.id || deletingId === category.id}
                        sx={{ 
                          minWidth: isMobile ? '100%' : 'auto',
                          px: isMobile ? 2 : 1.5,
                          py: isMobile ? 1 : 0.5,
                          fontSize: isMobile ? '0.8rem' : '0.75rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)'
                          },
                          '&.Mui-disabled': {
                            borderColor: 'rgba(25, 118, 210, 0.26)',
                            color: 'rgba(25, 118, 210, 0.26)'
                          }
                        }}
                      >
                        {isMobile ? (categoryModalLoading === category.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <Edit sx={{ mr: 1 }} />) : null}
                        {categoryModalLoading === category.id ? 'กำลังโหลด...' : 'แก้ไข'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="ลบหมวดหมู่" arrow placement="top">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={!isMobile && (deletingId === category.id ? <CircularProgress size={16} /> : <Delete />)}
                        onClick={() => deleteCategory(category.id, category.name, category._count?.menuItems || 0)}
                        disabled={categoryModalLoading === category.id || deletingId === category.id}
                        sx={{ 
                          minWidth: isMobile ? '100%' : 'auto',
                          px: isMobile ? 2 : 1.5,
                          py: isMobile ? 1 : 0.5,
                          fontSize: isMobile ? '0.8rem' : '0.75rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: 'error.main',
                          color: 'error.main',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'error.dark',
                            backgroundColor: 'rgba(244, 67, 54, 0.08)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.25)'
                          },
                          '&.Mui-disabled': {
                            borderColor: 'rgba(244, 67, 54, 0.26)',
                            color: 'rgba(244, 67, 54, 0.26)'
                          }
                        }}
                      >
                        {isMobile ? (deletingId === category.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <Delete sx={{ mr: 1 }} />) : null}
                        {deletingId === category.id ? 'กำลังลบ...' : 'ลบ'}
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
                
                {category.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.description}
                  </Typography>
                )}
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`${category._count?.menuItems || 0} เมนู`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={category.isActive ? <Visibility /> : <VisibilityOff />}
                    label={category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    size="small"
                    color={category.isActive ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {categories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              ยังไม่มีหมวดหมู่
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              เริ่มต้นด้วยการเพิ่มหมวดหมู่แรกของคุณ
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCategoryModal()}
              disabled={!!categoryModalLoading || !!deletingId}
            >
              เพิ่มหมวดหมู่แรก
            </Button>
          </Box>
        )}
      </TabPanel>

      {/* Menu Items Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            เมนูอาหาร
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openMenuItemModal()}
            disabled={categories.length === 0 || !!menuItemModalLoading || !!deletingId}
          >
            เพิ่มเมนู
          </Button>
        </Box>

        {categories.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            กรุณาเพิ่มหมวดหมู่ก่อนเพิ่มเมนูอาหาร
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {menuItems.map((menuItem) => (
              <Card key={menuItem.id} sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                opacity: (() => {
                  const category = categories.find(c => c.id === menuItem.categoryId);
                  if (!category?.isActive) return 0.5;
                  if (!menuItem.isAvailable) return 0.7;
                  return 1;
                })(),
                border: (() => {
                  const category = categories.find(c => c.id === menuItem.categoryId);
                  if (!category?.isActive) return `1px solid ${theme.palette.error.light}`;
                  if (!menuItem.isAvailable) return `1px solid ${theme.palette.warning.light}`;
                  return 'none';
                })(),
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}>
                {menuItem.imageUrl && (
                  <Box
                    component="img"
                    src={menuItem.imageUrl}
                    alt={menuItem.name}
                    sx={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover'
                    }}
                  />
                )}
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 , mb: 2}}>
                      {menuItem.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                      <Tooltip title="แก้ไขเมนู" arrow placement="top">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={!isMobile && (menuItemModalLoading === menuItem.id ? <CircularProgress size={16} /> : <Edit />)}
                          onClick={() => openMenuItemModal(menuItem)}
                          disabled={menuItemModalLoading === menuItem.id || deletingId === menuItem.id}
                          sx={{ 
                            minWidth: isMobile ? '100%' : 'auto',
                            px: isMobile ? 2 : 1.5,
                            py: isMobile ? 1 : 0.5,
                            fontSize: isMobile ? '0.8rem' : '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              borderColor: 'primary.dark',
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)'
                            },
                            '&.Mui-disabled': {
                              borderColor: 'rgba(25, 118, 210, 0.26)',
                              color: 'rgba(25, 118, 210, 0.26)'
                            }
                          }}
                        >
                          {isMobile ? (menuItemModalLoading === menuItem.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <Edit sx={{ mr: 1 }} />) : null}
                          {menuItemModalLoading === menuItem.id ? 'กำลังโหลด...' : 'แก้ไข'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="ลบเมนู" arrow placement="top">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={!isMobile && (deletingId === menuItem.id ? <CircularProgress size={16} /> : <Delete />)}
                          onClick={() => deleteMenuItem(menuItem.id, menuItem.name)}
                          disabled={menuItemModalLoading === menuItem.id || deletingId === menuItem.id}
                          sx={{ 
                            minWidth: isMobile ? '100%' : 'auto',
                            px: isMobile ? 2 : 1.5,
                            py: isMobile ? 1 : 0.5,
                            fontSize: isMobile ? '0.8rem' : '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'error.main',
                            color: 'error.main',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              borderColor: 'error.dark',
                              backgroundColor: 'rgba(244, 67, 54, 0.08)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.25)'
                            },
                            '&.Mui-disabled': {
                              borderColor: 'rgba(244, 67, 54, 0.26)',
                              color: 'rgba(244, 67, 54, 0.26)'
                            }
                          }}
                        >
                          {isMobile ? (deletingId === menuItem.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <Delete sx={{ mr: 1 }} />) : null}
                          {deletingId === menuItem.id ? 'กำลังลบ...' : 'ลบ'}
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {menuItem.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {menuItem.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    {menuItem.originalPrice && menuItem.originalPrice > menuItem.price ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          ฿{menuItem.originalPrice.toLocaleString()}
                        </Typography>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                          ฿{menuItem.price.toLocaleString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                        ฿{menuItem.price.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {(() => {
                      const category = categories.find(c => c.id === menuItem.categoryId);
                      return (
                        <Chip
                          label={category?.name || 'ไม่ทราบหมวดหมู่'}
                          size="small"
                          variant="outlined"
                          sx={!category?.isActive ? { 
                            bgcolor: 'error.50', 
                            borderColor: 'error.main',
                            color: 'error.main'
                          } : {}}
                        />
                      );
                    })()}
                    {menuItem.calories && (
                      <Chip
                        label={`${menuItem.calories} แคล`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {menuItem.addons && menuItem.addons.length > 0 && (
                      <Chip
                        icon={<LocalOffer />}
                        label={`${menuItem.addons.length} Add-ons`}
                        size="small"
                        color="secondary"
                      />
                    )}
                    {/* Tags Badges */}
                    {menuItem.tags && menuItem.tags.length > 0 && (
                      menuItem.tags.map((tagValue) => {
                        const tag = availableTags.find(t => t.value === tagValue);
                        if (!tag) return null;
                        return (
                          <Chip
                            key={tagValue}
                            icon={tag.icon}
                            label={tag.label}
                            size="small"
                            variant="filled"
                            sx={{
                              backgroundColor: `${tag.color}20`,
                              borderColor: tag.color,
                              color: tag.color,
                              '& .MuiChip-icon': {
                                color: tag.color
                              },
                              fontSize: '0.7rem',
                              height: '24px'
                            }}
                          />
                        );
                      })
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      icon={menuItem.isAvailable ? <Visibility /> : <VisibilityOff />}
                      label={menuItem.isAvailable ? 'มีจำหน่าย' : 'ไม่มีจำหน่าย'}
                      size="small"
                      color={menuItem.isAvailable ? 'success' : 'default'}
                    />
                    {(() => {
                      const category = categories.find(c => c.id === menuItem.categoryId);
                      if (!category?.isActive) {
                        return (
                          <Chip
                            label="หมวดหมู่ปิด"
                            size="small"
                            sx={{ 
                              bgcolor: 'error.main', 
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {menuItems.length === 0 && categories.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              ยังไม่มีเมนูอาหาร
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              เริ่มต้นด้วยการเพิ่มเมนูแรกของคุณ
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openMenuItemModal()}
              disabled={!!menuItemModalLoading || !!deletingId}
            >
              เพิ่มเมนูแรก
            </Button>
          </Box>
        )}
      </TabPanel>

      {/* Category Modal */}
      <Dialog
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            height: isMobile ? '100vh' : 'auto',
            margin: isMobile ? 0 : 'auto',
            maxHeight: isMobile ? '100vh' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          position: isMobile ? 'sticky' : 'static',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1
        }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
          </Typography>
          {isMobile && (
                         <IconButton
               edge="end"
               color="inherit"
               onClick={() => setCategoryModalOpen(false)}
               aria-label="close"
             >
               <Close />
             </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="ชื่อหมวดหมู่ *"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="คำอธิบาย"
              multiline
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                รูปภาพหมวดหมู่
              </Typography>
              <ImageUploadDropzone
                currentImageUrl={categoryForm.imageUrl}
                onImageChange={handleCategoryImageChange}
                variant="banner"
                size="large"
                category="menu"
                restaurantId={restaurant?.id}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: isMobile ? 1 : 0,
          padding: isMobile ? 2 : 1,
          borderTop: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          position: isMobile ? 'sticky' : 'static',
          bottom: 0,
          backgroundColor: 'background.paper'
        }}>
          <Button 
            onClick={() => setCategoryModalOpen(false)}
            fullWidth={isMobile}
            sx={{ 
              order: isMobile ? 2 : 1,
              py: isMobile ? 1.5 : 1
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={saveCategoryData}
            disabled={categorySaving}
            startIcon={categorySaving ? <CircularProgress size={16} color="inherit" /> : (editingCategory ? <Edit /> : <Add />)}
            fullWidth={isMobile}
            sx={{ 
              order: isMobile ? 1 : 2,
              py: isMobile ? 1.5 : 1,
              position: 'relative',
              overflow: 'hidden',
              '&.Mui-disabled': {
                bgcolor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {categorySaving ? (
              editingCategory ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...'
            ) : (
              editingCategory ? 'อัปเดต' : 'เพิ่ม'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MenuItem Modal */}
      <Dialog
        open={menuItemModalOpen}
        onClose={() => setMenuItemModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            height: isMobile ? '100vh' : 'auto',
            margin: isMobile ? 0 : 'auto',
            maxHeight: isMobile ? '100vh' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          position: isMobile ? 'sticky' : 'static',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1
        }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {editingMenuItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
          </Typography>
          {isMobile && (
                         <IconButton
               edge="end"
               color="inherit"
               onClick={() => setMenuItemModalOpen(false)}
               aria-label="close"
             >
               <Close />
             </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ 
          height: isMobile ? 'calc(100vh - 120px)' : '80vh', 
          overflow: 'auto',
          padding: isMobile ? 2 : 3
        }}>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ข้อมูลพื้นฐาน
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="ชื่อเมนู *"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <FormControl fullWidth>
                    <InputLabel>หมวดหมู่ *</InputLabel>
                    <Select
                      value={menuItemForm.categoryId}
                      label="หมวดหมู่ *"
                      onChange={(e) => setMenuItemForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    >
                      {categories.filter(c => c.isActive).map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                                  <TextField
                    fullWidth
                    label="คำอธิบาย"
                    multiline
                    rows={3}
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm(prev => ({ ...prev, description: e.target.value }))}
                  />
              </Box>
            </Card>

            {/* Pricing */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ราคา
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                  <TextField
                    fullWidth
                    label="ราคาปกติ (ก่อนลด)"
                    type="number"
                    value={menuItemForm.originalPrice}
                    onChange={(e) => setMenuItemForm(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                    inputProps={{ min: 0, step: 1 }}
                    helperText="ใส่ราคาก่อนลดหากมีการลดราคา"
                  />
                  <TextField
                    fullWidth
                    label="ราคาขาย (หลังลด) *"
                    type="number"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    inputProps={{ min: 0, step: 1 }}
                    required
                  />
              </Box>
            </Card>

            {/* Image Upload */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                รูปภาพเมนู
              </Typography>
              
              <ImageUploadDropzone
                currentImageUrl={menuItemForm.imageUrl}
                onImageChange={handleMenuItemImageChange}
                variant="banner"
                size="large"
                category="menu"
                restaurantId={restaurant?.id}
              />
            </Card>

            {/* Tags Management */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ป้ายกำกับ
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2 }}
              >
                เลือกป้ายกำกับที่เหมาะสมกับเมนูนี้
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag.value}
                    icon={tag.icon}
                    label={tag.label}
                    onClick={() => handleTagToggle(tag.value)}
                    variant={menuItemForm.tags.includes(tag.value) ? "filled" : "outlined"}
                    sx={{
                      mb: 1,
                      backgroundColor: menuItemForm.tags.includes(tag.value) 
                        ? `${tag.color}20` 
                        : 'transparent',
                      borderColor: tag.color,
                      color: menuItemForm.tags.includes(tag.value) 
                        ? tag.color 
                        : 'text.secondary',
                      '& .MuiChip-icon': {
                        color: menuItemForm.tags.includes(tag.value) 
                          ? tag.color 
                          : 'text.secondary'
                      },
                      '&:hover': {
                        backgroundColor: `${tag.color}15`,
                        borderColor: tag.color,
                        color: tag.color,
                        '& .MuiChip-icon': {
                          color: tag.color
                        }
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Stack>

              {menuItemForm.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    ป้ายกำกับที่เลือก: {menuItemForm.tags.length} รายการ
                  </Typography>
                </Box>
              )}
            </Card>

            {/* Add-ons Management */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                จัดการ Add-ons
              </Typography>
              
              {/* Add/Edit addon form */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'end', flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="ชื่อ Add-on"
                  value={newAddon.name}
                  onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                  sx={{ flex: 1 , width: '100%'}}
                />
                <TextField
                  label="ราคาเพิ่ม (บาท)"
                  type="number"
                  value={newAddon.price}
                  onChange={(e) => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ flex: 1 , width: '100%'}}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={editingAddon ? "contained" : "outlined"}
                    onClick={addAddonToForm}
                    startIcon={editingAddon ? <Save /> : <Add />}
                    sx={{ minWidth: 120 }}
                  >
                    {editingAddon ? 'บันทึก' : 'เพิ่ม'}
                  </Button>
                  {editingAddon && (
                    <Button
                      variant="outlined"
                      onClick={cancelEditAddon}
                      sx={{ minWidth: 80 }}
                    >
                      ยกเลิก
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Addons list */}
              {menuItemForm.addons.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    Add-ons ที่เพิ่มแล้ว ({menuItemForm.addons.length})
                  </Typography>
                  <List dense>
                    {menuItemForm.addons.map((addon, index) => (
                      <ListItem 
                        key={index} 
                        sx={{ 
                          border: 1, 
                          borderColor: editingAddon?.index === index ? 'primary.main' : 'divider', 
                          borderRadius: 1, 
                          mb: 1,
                          backgroundColor: editingAddon?.index === index ? 'primary.50' : 'transparent'
                        }}
                      >
                        <ListItemText
                          primary={addon.name}
                          secondary={`+฿${addon.price.toLocaleString()}`}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => editAddonInForm(addon, index)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeAddonFromForm(index)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Card>

            {/* Additional Settings */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                การตั้งค่าเพิ่มเติม
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                  <TextField
                    fullWidth
                    label="แคลอรี"
                    type="number"
                    value={menuItemForm.calories}
                    onChange={(e) => setMenuItemForm(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                    inputProps={{ min: 0 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={menuItemForm.isAvailable}
                          onChange={(e) => setMenuItemForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        />
                      }
                      label="มีจำหน่าย"
                    />
                  </Box>
              </Box>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: isMobile ? 1 : 0,
          padding: isMobile ? 2 : 1,
          borderTop: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          position: isMobile ? 'sticky' : 'static',
          bottom: 0,
          backgroundColor: 'background.paper'
        }}>
          <Button 
            onClick={() => setMenuItemModalOpen(false)}
            fullWidth={isMobile}
            sx={{ 
              order: isMobile ? 2 : 1,
              py: isMobile ? 1.5 : 1
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={saveMenuItemData}
            disabled={menuItemSaving}
            startIcon={menuItemSaving ? <CircularProgress size={16} color="inherit" /> : (editingMenuItem ? <Edit /> : <Add />)}
            fullWidth={isMobile}
            sx={{ 
              order: isMobile ? 1 : 2,
              py: isMobile ? 1.5 : 1,
              position: 'relative',
              overflow: 'hidden',
              '&.Mui-disabled': {
                bgcolor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {menuItemSaving ? (
              editingMenuItem ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...'
            ) : (
              editingMenuItem ? 'อัปเดต' : 'เพิ่ม'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            padding: isMobile ? 0 : 1,
            height: isMobile ? '100vh' : 'auto',
            margin: isMobile ? 0 : 'auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: 'error.main',
          fontSize: '1.25rem',
          fontWeight: 600
        }}>
          <Box sx={{ 
            bgcolor: 'error.100', 
            borderRadius: '50%', 
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Delete sx={{ color: 'error.main', fontSize: 24 }} />
          </Box>
          {deleteTarget?.id === 'close-category' 
            ? 'ยืนยันการปิดการใช้งานหมวดหมู่' 
            : `ยืนยันการลบ${deleteTarget?.type === 'category' ? 'หมวดหมู่' : 'เมนู'}`
          }
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            คุณแน่ใจหรือไม่ที่ต้องการ
            {deleteTarget?.id === 'close-category' 
              ? 'ปิดการใช้งาน' 
              : `ลบ${deleteTarget?.type === 'category' ? 'หมวดหมู่' : 'เมนู'}`
            }
            <strong> "{deleteTarget?.name}"</strong>?
          </Typography>
          
          {deleteTarget?.details && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {deleteTarget.details}
              </Typography>
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {deleteTarget?.id === 'close-category' 
              ? 'คุณสามารถเปิดการใช้งานได้อีกครั้งภายหลัง'
              : ''
            }
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={closeDeleteConfirm}
            variant="outlined"
            disabled={deleting}
            sx={{ minWidth: 100 }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            sx={{ minWidth: 100 }}
          >
            {deleting 
              ? (deleteTarget?.id === 'close-category' ? 'กำลังปิด...' : 'กำลังลบ...')
              : (deleteTarget?.id === 'close-category' ? 'ปิดการใช้งาน' : 'ลบ')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Notification จะแสดงผ่าน NotificationProvider แล้ว */}
    </Box>
  );
} 