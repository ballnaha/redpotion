'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Skeleton,
  Alert,
  Chip,
  CardMedia,
  CardActions,
  Tooltip
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  PhotoLibrary,
  Visibility,
  VisibilityOff,
  DragIndicator,
  CloudUpload
} from '@mui/icons-material'
import { useNotification } from '@/hooks/useGlobalNotification'
import ImageUploadDropzone from '../components/ImageUploadDropzone'

interface Gallery {
  id: string
  title?: string
  description?: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
}

export default function GalleryPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { showSuccess, showError, showInfo } = useNotification()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isActive: true,
    sortOrder: 0
  })
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)

  const { data: galleries, error, isLoading, mutate } = useSWR<Gallery[]>(
    sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER'
      ? '/api/restaurant/gallery'
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Get restaurant data for folder structure
  const { data: restaurant } = useSWR(
    sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER'
      ? '/api/restaurant/my-restaurant'
      : null,
    fetcher
  )

  // Redirect if not authenticated or not restaurant owner
  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin')
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/')
    }
  }, [sessionStatus, session?.user?.role, router])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      isActive: true,
      sortOrder: 0
    })
    setUploadingFile(null)
    setEditingGallery(null)
  }

  const handleOpenModal = (gallery?: Gallery) => {
    if (gallery) {
      setEditingGallery(gallery)
      setFormData({
        title: gallery.title || '',
        description: gallery.description || '',
        imageUrl: gallery.imageUrl,
        isActive: gallery.isActive,
        sortOrder: gallery.sortOrder
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleImageChange = async (imageUrl: string | null, file?: File) => {
    if (file && restaurant?.id) {
      // Store the file for upload when form is submitted
      setUploadingFile(file)
      setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))
    } else if (!file) {
      // Image was removed
      setUploadingFile(null)
      setFormData(prev => ({ ...prev, imageUrl: '' }))
    }
  }

  const handleSubmit = async () => {
    // Upload image first if there's a new file
    let finalImageUrl = formData.imageUrl

    if (uploadingFile && restaurant?.id) {
      try {
        showInfo('กำลังอัปโหลดรูปภาพ...')
        
        const uploadFormData = new FormData()
        uploadFormData.append('file', uploadingFile)
        uploadFormData.append('category', 'gallery')
        uploadFormData.append('variant', 'gallery')
        
        const uploadResponse = await fetch('/api/restaurant/upload-image', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
        }

        const uploadResult = await uploadResponse.json()
        finalImageUrl = uploadResult.imageUrl
        
        console.log('✅ Gallery image uploaded:', {
          originalFile: uploadingFile.name,
          uploadedUrl: finalImageUrl,
          restaurantId: restaurant.id,
          category: 'gallery'
        })
      } catch (error: any) {
        showError(error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
        return
      }
    }

    if (!finalImageUrl.trim()) {
      showError('กรุณาอัปโหลดรูปภาพ')
      return
    }

    setIsSubmitting(true)
    showInfo('กำลังบันทึกข้อมูล...')

    try {
      const url = editingGallery
        ? `/api/restaurant/gallery/${editingGallery.id}`
        : '/api/restaurant/gallery'
      
      const method = editingGallery ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImageUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'เกิดข้อผิดพลาด')
      }

      showSuccess(editingGallery ? 'อัปเดตแกลเลอรี่สำเร็จ!' : 'เพิ่มรูปภาพสำเร็จ!')
      mutate()
      handleCloseModal()
    } catch (error: any) {
      showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!galleryToDelete) return

    setIsSubmitting(true)
    showInfo('กำลังลบรูปภาพ...')

    try {
      const response = await fetch(`/api/restaurant/gallery/${galleryToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'เกิดข้อผิดพลาด')
      }

      showSuccess('ลบรูปภาพสำเร็จ!')
      mutate()
      setDeleteDialogOpen(false)
      setGalleryToDelete(null)
    } catch (error: any) {
      showError(error.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleGalleryStatus = async (gallery: Gallery) => {
    showInfo('กำลังอัปเดตสถานะ...')

    try {
      const response = await fetch(`/api/restaurant/gallery/${gallery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...gallery,
          isActive: !gallery.isActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'เกิดข้อผิดพลาด')
      }

      showSuccess(gallery.isActive ? 'ซ่อนรูปภาพแล้ว' : 'แสดงรูปภาพแล้ว')
      mutate()
    } catch (error: any) {
      showError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }

  // Don't render if not authenticated or wrong role
  if (sessionStatus === 'unauthenticated' || 
      (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER')) {
    return null
  }

        if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          แกลเลอรี่ร้านอาหาร
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)', 
            lg: 'repeat(4, 1fr)' 
          }, 
          gap: 3 
        }}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Box key={item}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          เกิดข้อผิดพลาดในการดึงข้อมูลแกลเลอรี่
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoLibrary sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            แกลเลอรี่ร้านอาหาร
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          sx={{ 
            borderRadius: 3,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          เพิ่มรูปภาพ
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(3, 1fr)' 
          }, 
          gap: 2 
        }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {galleries?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              รูปภาพทั้งหมด
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
              {galleries?.filter(g => g.isActive).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กำลังแสดง
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
              {galleries?.filter(g => !g.isActive).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ซ่อนอยู่
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* Gallery Grid */}
      {galleries && galleries.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)', 
            lg: 'repeat(4, 1fr)' 
          }, 
          gap: 3 
        }}>
          {galleries.map((gallery) => (
            <Box key={gallery.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: gallery.isActive ? 1 : 0.6,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                {/* Status Chip */}
                <Chip
                  label={gallery.isActive ? 'แสดง' : 'ซ่อน'}
                  color={gallery.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: gallery.isActive ? 'rgba(46, 125, 50, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                    color: 'white'
                  }}
                />

                {/* Sort Order */}
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <DragIndicator sx={{ fontSize: 14 }} />
                  {gallery.sortOrder}
                </Box>

                <CardMedia
                  component="img"
                  height="200"
                  image={gallery.imageUrl}
                  alt={gallery.title || 'Gallery image'}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="h6" noWrap sx={{ fontWeight: 500, mb: 1 }}>
                    {gallery.title || 'ไม่มีชื่อ'}
                  </Typography>
                  
                  {gallery.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {gallery.description}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="แก้ไข">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenModal(gallery)}
                        sx={{ color: 'primary.main' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={gallery.isActive ? 'ซ่อน' : 'แสดง'}>
                      <IconButton
                        size="small"
                        onClick={() => toggleGalleryStatus(gallery)}
                        sx={{ color: gallery.isActive ? 'warning.main' : 'success.main' }}
                      >
                        {gallery.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Tooltip title="ลบ">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setGalleryToDelete(gallery)
                        setDeleteDialogOpen(true)
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <PhotoLibrary sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ยังไม่มีรูปภาพในแกลเลอรี่
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            เพิ่มรูปภาพเพื่อแสดงบรรยากาศร้านอาหารของคุณ
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            เพิ่มรูปภาพแรก
          </Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload sx={{ color: 'primary.main' }} />
            {editingGallery ? 'แก้ไขรูปภาพ' : 'เพิ่มรูปภาพใหม่'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                รูปภาพ *
              </Typography>
              <ImageUploadDropzone
                onImageChange={handleImageChange}
                currentImageUrl={formData.imageUrl}
                restaurantId={restaurant?.id}
                category="gallery"
                variant="gallery"
                size="large"
                maxFileSize={10 * 1024 * 1024} // 10MB limit for gallery
              />
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="ชื่อรูปภาพ"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="เช่น บรรยากาศร้าน, เมนูพิเศษ"
            />

            {/* Description */}
            <TextField
              fullWidth
              label="คำอธิบาย"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="อธิบายเกี่ยวกับรูปภาพนี้..."
            />

            {/* Settings */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="แสดงในแกลเลอรี่"
              />
              
              <TextField
                type="number"
                label="ลำดับการแสดง"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                sx={{ width: 150 }}
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseModal} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.imageUrl.trim()}
          >
            {isSubmitting ? 'กำลังบันทึก...' : editingGallery ? 'อัปเดต' : 'เพิ่ม'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบรูปภาพ "{galleryToDelete?.title || 'ไม่มีชื่อ'}" หรือไม่?
            <br />
            การกระทำนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 