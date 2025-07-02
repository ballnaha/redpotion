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
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
  Stack,
  Slide,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  PhotoLibrary,
  Visibility,
  VisibilityOff,
  DragIndicator,
  CloudUpload,
  Close
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'
import React from 'react'
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

// Transition for mobile full-screen modal
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function GalleryPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { showSuccess, showError, showInfo } = useNotification()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null)
  const [togglingGalleryId, setTogglingGalleryId] = useState<string | null>(null)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const [imagePreloadingId, setImagePreloadingId] = useState<string | null>(null)

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
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      revalidateIfStale: true,
      revalidateOnMount: true
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

  const handleOpenModal = async (gallery?: Gallery) => {
    if (gallery) {
      // Preload image before opening modal
      if (gallery.imageUrl && !gallery.imageUrl.startsWith('blob:')) {
        setImagePreloadingId(gallery.id)
        
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = gallery.imageUrl
          })
          
          console.log('✅ Image preloaded successfully:', gallery.imageUrl)
        } catch (error) {
          console.log('❌ Image preload failed:', error)
          // ถ้าโหลดรูปไม่ได้ ก็ยังให้เปิด modal ได้ (รูปจะซ่อนอัตโนมัติใน ImageUploadDropzone)
        } finally {
          setImagePreloadingId(null)
        }
      }
      
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
    setLastSubmitTime(0) // รีเซ็ต debounce timer
    resetForm()
  }

  const handleImageChange = async (imageUrl: string | null, file?: File) => {
    console.log('🖼️ handleImageChange called:', { imageUrl, file: file?.name, hasRestaurant: !!restaurant?.id })
    
    if (file && restaurant?.id) {
      // Store the file for upload when form is submitted
      setUploadingFile(file)
      // Set the blob URL for preview, it will be replaced with server URL when uploaded
      setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))
    } else if (imageUrl && !file) {
      // Direct URL change (existing image)
      setUploadingFile(null)
      setFormData(prev => ({ ...prev, imageUrl: imageUrl }))
    } else {
      // Image was removed
      setUploadingFile(null)
      setFormData(prev => ({ ...prev, imageUrl: '' }))
    }
  }

  const handleSubmit = async () => {
    // ป้องกันการกดซ้ำด้วย debounce (1 วินาที)
    const now = Date.now()
    if (isSubmitting || (now - lastSubmitTime < 1000)) {
      console.log('⚠️ handleSubmit blocked: submitting or too soon after last submit')
      return
    }

    setIsSubmitting(true)
    setLastSubmitTime(now)
    
    console.log('📝 handleSubmit called:', { 
      formData, 
      uploadingFile: uploadingFile?.name, 
      editingGallery: editingGallery?.id 
    })

    try {
      // Upload image first if there's a new file
      let finalImageUrl = formData.imageUrl

      if (uploadingFile && restaurant?.id) {
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
      } else if (editingGallery && !uploadingFile) {
        // For update without new file, use existing image URL
        finalImageUrl = editingGallery.imageUrl
        console.log('🔄 Using existing image URL for update:', finalImageUrl)
      }

      if (!finalImageUrl.trim()) {
        showError('กรุณาอัปโหลดรูปภาพ')
        return
      }

      showInfo('กำลังบันทึกข้อมูล...')

      const url = editingGallery ? `/api/restaurant/gallery/${editingGallery.id}` : '/api/restaurant/gallery'
      const method = editingGallery ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
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

      // Force revalidate และ refresh ข้อมูลทันที
      await mutate(undefined, { revalidate: true })
      showSuccess(editingGallery ? 'อัปเดตรูปภาพสำเร็จ!' : 'เพิ่มรูปภาพสำเร็จ!')
      handleCloseModal()
    } catch (error: any) {
      console.error('❌ Gallery submit error:', error)
      showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      // รีเซ็ต debounce timer เมื่อเกิด error เพื่อให้สามารถลองใหม่ได้
      setLastSubmitTime(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!galleryToDelete || isSubmitting) return

    setIsSubmitting(true)
    showInfo('กำลังลบรูปภาพ...')

    try {
      const response = await fetch(`/api/restaurant/gallery/${galleryToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการลบ')
      }

      // Force revalidate และ refresh ข้อมูลทันที
      await mutate(undefined, { revalidate: true })
      showSuccess('ลบรูปภาพสำเร็จ!')
      setDeleteDialogOpen(false)
      setGalleryToDelete(null)
    } catch (error: any) {
      showError(error.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleGalleryStatus = async (gallery: Gallery) => {
    if (togglingGalleryId === gallery.id) return // ป้องกันการกดซ้ำ
    
    setTogglingGalleryId(gallery.id)
    showInfo(gallery.isActive ? 'กำลังซ่อนรูปภาพ...' : 'กำลังแสดงรูปภาพ...')

    // Optimistic update - อัปเดต UI ทันทีก่อนรอ API
    const updatedGallery = { ...gallery, isActive: !gallery.isActive }
    mutate(
      galleries?.map(g => g.id === gallery.id ? updatedGallery : g),
      false // ไม่ revalidate ทันที เพื่อให้เห็นการเปลี่ยนแปลงก่อน
    )

    try {
      const response = await fetch(`/api/restaurant/gallery/${gallery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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

      // Force revalidate และ refresh ข้อมูลทันที
      await mutate(undefined, { revalidate: true })
      showSuccess(gallery.isActive ? 'ซ่อนรูปภาพแล้ว!' : 'แสดงรูปภาพแล้ว!')
    } catch (error: any) {
      // Rollback optimistic update เมื่อเกิด error
      await mutate(undefined, { revalidate: true })
      showError(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
    } finally {
      setTogglingGalleryId(null)
    }
  }

  // Loading state
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <Skeleton variant="rectangular" height={200} />
              <CardContent>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 10, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoLibrary />
            แกลเลอรี่ร้านอาหาร
          </Typography>
          <Typography variant="body1" color="text.secondary">
            จัดการรูปภาพแสดงบรรยากาศและความน่าสนใจของร้านอาหารของคุณ
          </Typography>
        </Box>
        {/* Add Button - Desktop */}
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            disabled={isSubmitting || !!togglingGalleryId}
            size="large"
          >
            เพิ่มรูปภาพ
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
              {galleries?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ทั้งหมด
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
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3
        }}>
          {galleries.map((gallery) => (
            <Card key={gallery.id} sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              opacity: gallery.isActive ? 1 : 0.7,
              border: !gallery.isActive ? `1px solid ${theme.palette.error.light}` : 'none',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}>
              {/* Image */}
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box
                  component="img"
                  src={gallery.imageUrl}
                  alt={gallery.title || 'Gallery image'}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // ซ่อนรูปภาพที่โหลดไม่ได้และแสดง fallback
                    e.currentTarget.style.display = 'none';
                    const fallbackContainer = e.currentTarget.parentElement?.querySelector('.fallback-container') as HTMLElement;
                    if (fallbackContainer) {
                      fallbackContainer.style.display = 'flex';
                    }
                  }}
                />
                
                                 {/* Minimal Professional Fallback */}
                 <Box
                   className="fallback-container"
                   sx={{
                     display: 'none', // จะแสดงเมื่อรูปภาพโหลดไม่ได้
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     width: '100%',
                     height: '100%',
                     background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flexDirection: 'column',
                     borderBottom: '1px solid #e2e8f0',
                     '&::before': {
                       content: '""',
                       position: 'absolute',
                       top: 0,
                       left: 0,
                       right: 0,
                       bottom: 0,
                       background: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                       pointerEvents: 'none'
                     }
                   }}
                 >
                   {/* Clean Icon */}
                   <Box
                     sx={{
                       width: 56,
                       height: 56,
                       borderRadius: '16px',
                       background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       mb: 2,
                       boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
                       position: 'relative',
                       '&::after': {
                         content: '""',
                         position: 'absolute',
                         inset: 2,
                         borderRadius: '14px',
                         background: 'rgba(255, 255, 255, 0.1)',
                         backdropFilter: 'blur(10px)'
                       }
                     }}
                   >
                     <PhotoLibrary 
                       sx={{ 
                         fontSize: 28,
                         color: 'white',
                         position: 'relative',
                         zIndex: 1
                       }} 
                     />
                   </Box>

                   {/* Professional Typography */}
                   <Typography 
                     variant="subtitle1"
                     sx={{ 
                       color: '#1e293b',
                       fontWeight: 700,
                       textAlign: 'center',
                       px: 3,
                       mb: 0.5,
                       fontSize: '1rem',
                       letterSpacing: '-0.02em',
                       lineHeight: 1.3
                     }}
                   >
                     {gallery.title || 'Gallery Item'}
                   </Typography>
                   
                   {gallery.description && (
                     <Typography 
                       variant="body2" 
                       sx={{ 
                         color: '#64748b',
                         textAlign: 'center',
                         px: 3,
                         fontSize: '0.875rem',
                         lineHeight: 1.4,
                         fontWeight: 400
                       }}
                     >
                       {gallery.description.length > 35 
                         ? `${gallery.description.substring(0, 35)}...` 
                         : gallery.description}
                     </Typography>
                   )}

                   {/* Subtle Loading Indicator */}
                   <Box
                     sx={{
                       position: 'absolute',
                       bottom: 12,
                       right: 12,
                       width: 6,
                       height: 6,
                       borderRadius: '50%',
                       background: '#3b82f6',
                       opacity: 0.4
                     }}
                   />
                 </Box>
              </Box>
              
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Title and Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {gallery.title || 'ไม่มีชื่อ'}
                      </Typography>
                      {!gallery.isActive && (
                        <Chip 
                          label="ซ่อน" 
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
                    {!gallery.isActive && (
                      <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic' }}>
                        ลูกค้าไม่เห็นรูปภาพนี้
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                    <Tooltip title="แก้ไขรูปภาพ" arrow placement="top">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={!isMobile && (imagePreloadingId === gallery.id ? <CircularProgress size={16} /> : <Edit />)}
                        onClick={() => handleOpenModal(gallery)}
                        disabled={togglingGalleryId === gallery.id || isSubmitting || imagePreloadingId === gallery.id}
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
                          }
                        }}
                      >
                        {isMobile ? (imagePreloadingId === gallery.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <Edit sx={{ mr: 1 }} />) : null}
                        {imagePreloadingId === gallery.id ? 'กำลังโหลด...' : 'แก้ไข'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="ลบรูปภาพ" arrow placement="top">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={!isMobile && <Delete />}
                        onClick={() => {
                          setGalleryToDelete(gallery)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={togglingGalleryId === gallery.id || isSubmitting}
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
                          }
                        }}
                      >
                        {isMobile ? <Delete sx={{ mr: 1 }} /> : null}
                        ลบ
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* Description */}
                {gallery.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {gallery.description}
                  </Typography>
                )}
                
                {/* Sort Order Chip */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<DragIndicator />}
                    label={`ลำดับ ${gallery.sortOrder}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                {/* Status and Actions */}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={gallery.isActive ? <Visibility /> : <VisibilityOff />}
                    label={gallery.isActive ? 'กำลังแสดง' : 'ซ่อนอยู่'}
                    size="small"
                    color={gallery.isActive ? 'success' : 'default'}
                  />
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => toggleGalleryStatus(gallery)}
                    disabled={togglingGalleryId === gallery.id}
                    startIcon={togglingGalleryId === gallery.id ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: gallery.isActive ? 'warning.main' : 'success.main',
                      '&:hover': {
                        backgroundColor: gallery.isActive ? 'rgba(237, 108, 2, 0.08)' : 'rgba(46, 125, 50, 0.08)'
                      },
                      '&.Mui-disabled': {
                        color: gallery.isActive ? 'rgba(237, 108, 2, 0.38)' : 'rgba(46, 125, 50, 0.38)'
                      }
                    }}
                  >
                    {togglingGalleryId === gallery.id 
                      ? 'กำลังประมวลผล...' 
                      : gallery.isActive ? 'ซ่อน' : 'แสดง'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
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
            disabled={isSubmitting || !!togglingGalleryId}
            size="large"
          >
            เพิ่มรูปภาพแรก
          </Button>
        </Card>
      )}

      {/* Mobile Add FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenModal()}
          disabled={isSubmitting || !!togglingGalleryId}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
            '&.Mui-disabled': {
              bgcolor: 'rgba(25, 118, 210, 0.12)',
              color: 'rgba(25, 118, 210, 0.26)'
            }
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Add/Edit Modal - Full screen on mobile */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              maxHeight: '100vh'
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="span">
              {editingGallery ? 'แก้ไขรูปภาพ' : 'เพิ่มรูปภาพใหม่'}
            </Typography>
          </Box>
          {isMobile && (
            <IconButton onClick={handleCloseModal} disabled={isSubmitting}>
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Image Upload */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                รูปภาพแกลเลอรี่
              </Typography>
              
              <ImageUploadDropzone
                onImageChange={handleImageChange}
                currentImageUrl={formData.imageUrl}
                restaurantId={restaurant?.id}
                category="gallery"
                variant="gallery"
                size="large"
                maxFileSize={10 * 1024 * 1024} // 10MB limit for gallery
                showPreview={true}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.6)',
                  mt: 2,
                  display: 'block'
                }}
              >
                💡 <strong>แนะนำ:</strong> ใช้รูปภาพที่มีสัดส่วน 16:9 (เช่น 1920x1080, 1280x720) ระบบจะปรับขนาดเป็น 1280x720 อัตโนมัติ<br/>
                ขนาดไฟล์สูงสุด 10MB | รองรับ JPG, PNG, WebP | คุณภาพ HD
              </Typography>
            </Card>

            {/* Basic Information */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ข้อมูลพื้นฐาน
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Title */}
                <TextField
                  fullWidth
                  label="ชื่อรูปภาพ"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="เช่น บรรยากาศร้าน, เมนูพิเศษ"
                  size={isMobile ? "medium" : "small"}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  label="คำอธิบาย"
                  multiline
                  rows={isMobile ? 4 : 3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="อธิบายเกี่ยวกับรูปภาพนี้..."
                  size={isMobile ? "medium" : "small"}
                />
              </Box>
            </Card>

            {/* Settings */}
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                การตั้งค่า
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3, 
                alignItems: { xs: 'stretch', md: 'center' }
              }}>
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
                  sx={{ width: { xs: '100%', md: 150 } }}
                  size={isMobile ? "medium" : "small"}
                />
              </Box>
            </Card>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: { xs: 2, md: 3 }, 
          pb: { xs: 2, md: 3 },
          gap: 1,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Button 
            onClick={handleCloseModal} 
            disabled={isSubmitting}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            ยกเลิก
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={isSubmitting || (!formData.imageUrl.trim() && !uploadingFile)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : (editingGallery ? <Edit /> : <Add />)}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              '&.Mui-disabled': {
                bgcolor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {isSubmitting ? (
              editingGallery ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...'
            ) : (
              editingGallery ? 'อัปเดต' : 'เพิ่ม'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="span">ยืนยันการลบ</Typography>
          {isMobile && (
            <IconButton onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontSize: { xs: '1rem', md: '0.875rem' } }}>
            คุณต้องการลบรูปภาพ "{galleryToDelete?.title || 'ไม่มีชื่อ'}" หรือไม่?
            <br />
            การกระทำนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, md: 3 }, 
          pb: { xs: 2, md: 3 },
          gap: 1,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isSubmitting}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            ยกเลิก
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={handleDelete}
            disabled={isSubmitting}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              '&.Mui-disabled': {
                bgcolor: 'rgba(244, 67, 54, 0.12)',
                color: 'rgba(244, 67, 54, 0.26)'
              }
            }}
          >
            {isSubmitting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 