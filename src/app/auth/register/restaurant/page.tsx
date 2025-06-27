'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Step,
  Stepper,
  StepLabel,
  Divider,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Stack,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormHelperText,
  Chip,
} from '@mui/material'

import {
  Restaurant,
  ArrowBack,
  ArrowForward,
  Check,
} from '@mui/icons-material'
import Link from 'next/link'
import MinimalFileUpload from '../../../restaurant/components/MinimalFileUpload'
import LocationPicker, { LocationData } from '../../../restaurant/components/LocationPicker'
import { useNotification } from './hooks/useNotification'
import Image from 'next/image'

interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
  uploading?: boolean;
  error?: string;
}

interface RegistrationData {
  // Personal Info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Restaurant Info
  restaurantName: string;
  restaurantDescription: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  
  // Business Info
  businessType: string;
  taxId: string;
  bankAccount: string;
  bankName: string;
  
  // Documents (Multi-upload)
  documents: FileWithPreview[];
  
  // Location
  location: LocationData;
  
  // Agreement
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

const steps = [
  'ข้อมูลส่วนตัว',
  'ข้อมูลร้าน & ตำแหน่ง', 
  'ข้อมูลธุรกิจ',
  'อัพโหลดเอกสาร',
  'ยืนยันข้อมูล'
];

export default function RestaurantRegisterPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { showSuccess, showError, showWarning, showInfo, NotificationComponent } = useNotification()

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      formData.documents.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantDescription: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    businessType: 'ร้านอาหาร',
    taxId: '',
    bankAccount: '',
    bankName: '',
    documents: [],
    location: {
      latitude: null,
      longitude: null,
      address: '',
      locationName: ''
    },
    agreeToTerms: false,
    agreeToPrivacy: false,
  })

  // Phone number formatting
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Format Thai phone number (0xx-xxx-xxxx)
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  // Validate phone number
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[6-9]\d{8}$/
    const cleanPhone = phone.replace(/\D/g, '')
    return phoneRegex.test(cleanPhone)
  }

  // Validate email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate Thai ID (Tax ID)
  const isValidTaxId = (taxId: string): boolean => {
    const cleanTaxId = taxId.replace(/\D/g, '')
    return cleanTaxId.length === 13
  }

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    // Format phone number on input
    if (field === 'restaurantPhone' && typeof value === 'string') {
      value = formatPhoneNumber(value)
    }
    
    // Handle multi-file uploads with preview
    if (field === 'documents' && Array.isArray(value)) {
      // Cleanup old preview URLs
      formData.documents.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
      
      // Create new preview URLs for all files
      const filesWithPreview = (value as File[]).map(file => {
        const fileWithPreview = file as FileWithPreview
        fileWithPreview.preview = URL.createObjectURL(file)
        return fileWithPreview
      })
      
      value = filesWithPreview
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
        if (!formData.name.trim()) {
          showError('กรุณากรอกชื่อ-นามสกุล')
          return false
        }
        if (formData.name.length < 2) {
          showError('ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร')
          return false
        }
        if (!formData.email.trim()) {
          showError('กรุณากรอกอีเมล')
          return false
        }
        if (!isValidEmail(formData.email)) {
          showError('รูปแบบอีเมลไม่ถูกต้อง')
          return false
        }
        if (!formData.password) {
          showError('กรุณากรอกรหัสผ่าน')
          return false
        }
        if (formData.password.length < 6) {
          showError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
          return false
        }

        if (formData.password !== formData.confirmPassword) {
          showError('รหัสผ่านไม่ตรงกัน')
          return false
        }
        break
        
      case 1: // Restaurant Info
        if (!formData.restaurantName.trim()) {
          showError('กรุณากรอกชื่อร้าน')
          return false
        }
        if (formData.restaurantName.length < 2) {
          showError('ชื่อร้านต้องมีอย่างน้อย 2 ตัวอักษร')
          return false
        }
        if (!formData.restaurantAddress.trim()) {
          showError('กรุณากรอกที่อยู่ร้าน')
          return false
        }
        if (formData.restaurantAddress.length < 10) {
          showError('ที่อยู่ต้องมีรายละเอียดอย่างน้อย 10 ตัวอักษร')
          return false
        }
        if (!formData.restaurantPhone.trim()) {
          showError('กรุณากรอกเบอร์โทรศัพท์ร้าน')
          return false
        }
        if (!isValidPhoneNumber(formData.restaurantPhone)) {
          showError('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเบอร์มือถือไทย)')
          return false
        }
        if (formData.restaurantEmail && !isValidEmail(formData.restaurantEmail)) {
          showError('รูปแบบอีเมลร้านไม่ถูกต้อง')
          return false
        }
        // Location validation
        if (!formData.location.latitude || !formData.location.longitude) {
          showError('กรุณาระบุตำแหน่งร้านอาหาร')
          return false
        }
        break
        
      case 2: // Business Info
        if (!formData.taxId.trim()) {
          showError('กรุณากรอกเลขประจำตัวผู้เสียภาษี')
          return false
        }
        if (!isValidTaxId(formData.taxId)) {
          showError('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
          return false
        }
        if (!formData.bankAccount.trim()) {
          showError('กรุณากรอกเลขบัญชีธนาคาร')
          return false
        }
        if (formData.bankAccount.length < 10) {
          showError('เลขบัญชีธนาคารต้องมีอย่างน้อย 10 หลัก')
          return false
        }
        if (!formData.bankName.trim()) {
          showError('กรุณากรอกชื่อธนาคาร')
          return false
        }
        break
        
      case 3: // Documents
        if (formData.documents.length === 0) {
          showError('กรุณาอัพโหลดเอกสารอย่างน้อย 1 ไฟล์')
          return false
        }
        if (formData.documents.length < 2) {
          showWarning('แนะนำให้อัพโหลดเอกสารครบถ้วน (บัตรประชาชน, หนังสือรับรองบัญชีธนาคาร)')
        }
        break
        
      case 4: // Confirmation
        if (!formData.agreeToTerms) {
          showError('กรุณายอมรับข้อกำหนดและเงื่อนไข')
          return false
        }
        if (!formData.agreeToPrivacy) {
          showError('กรุณายอมรับนโยบายความเป็นส่วนตัว')
          return false
        }
        break
    }
    
    setError('')
    return true
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
      //showSuccess('ข้อมูลถูกต้อง สามารถไปขั้นตอนถัดไปได้')
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }



  const uploadFile = async (file: FileWithPreview, category: string): Promise<any | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      const response = await fetch('/api/auth/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const result = await response.json()
      return {
        url: result.url,
        fileName: result.fileName || file.name,
        fileSize: result.size || file.size,
        mimeType: result.type || file.type,
        originalName: file.name
      }
    } catch (error) {
      console.error('Upload error:', error)
      showError(`ไม่สามารถอัพโหลดไฟล์ ${file.name} ได้`)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setLoading(true)
    showInfo('กำลังสมัครสมาชิก กรุณารอสักครู่...')

    try {
      // Upload all documents
      const documentData: any[] = []
      for (const document of formData.documents) {
        const uploadResult = await uploadFile(document, 'documents')
        if (uploadResult) {
          documentData.push(uploadResult)
        }
      }

      // Register restaurant
      const response = await fetch('/api/auth/register/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          restaurantName: formData.restaurantName,
          restaurantDescription: formData.restaurantDescription,
          restaurantAddress: formData.restaurantAddress,
          restaurantPhone: formData.restaurantPhone.replace(/\D/g, ''), // Store clean phone number
          restaurantEmail: formData.restaurantEmail,
          businessType: formData.businessType,
          taxId: formData.taxId.replace(/\D/g, ''), // Store clean tax ID
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
          locationName: formData.location.locationName,
          documents: documentData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      showSuccess('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...')

      // Auto sign in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        showWarning('สมัครสำเร็จแต่ไม่สามารถเข้าสู่ระบบอัตโนมัติได้ กรุณาเข้าสู่ระบบด้วยตนเอง')
        router.push('/auth/signin')
      } else {
        showSuccess('เข้าสู่ระบบสำเร็จ!')
        router.push('/restaurant')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      showError(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" color="primary">
              ข้อมูลส่วนตัว
            </Typography>
            <TextField
              fullWidth
              label="ชื่อ-นามสกุล"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              error={!formData.name.trim() && formData.name !== ''}
              helperText={!formData.name.trim() && formData.name !== '' ? 'กรุณากรอกชื่อ-นามสกุล' : ''}
              InputLabelProps={{
                shrink: !!formData.name || undefined
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
            <TextField
              fullWidth
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              error={formData.email !== '' && !isValidEmail(formData.email)}
              helperText={formData.email !== '' && !isValidEmail(formData.email) ? 'รูปแบบอีเมลไม่ถูกต้อง' : ''}
              inputProps={{ inputMode: 'email' }}
              InputLabelProps={{
                shrink: !!formData.email || undefined
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
            <TextField
              fullWidth
              label="รหัสผ่าน"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              error={formData.password !== '' && formData.password.length < 6}
              helperText={formData.password !== '' && formData.password.length < 6 ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : ''}
              InputLabelProps={{
                shrink: !!formData.password || undefined
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
            <TextField
              fullWidth
              label="ยืนยันรหัสผ่าน"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
              helperText={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : ''}
              InputLabelProps={{
                shrink: !!formData.confirmPassword || undefined
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
          </Stack>
        )

      case 1:
                  return (
            <Stack spacing={3}>
              <Typography variant="h6" color="primary">
                ข้อมูลร้าน & ตำแหน่ง
              </Typography>
            <TextField
              fullWidth
              label="ชื่อร้าน"
              value={formData.restaurantName}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              required
              InputLabelProps={{
                shrink: !!formData.restaurantName || undefined
              }}
            />
            <TextField
              fullWidth
              label="คำอธิบายร้าน"
              value={formData.restaurantDescription}
              onChange={(e) => handleInputChange('restaurantDescription', e.target.value)}
              multiline
              rows={3}
              placeholder="อธิบายเกี่ยวกับร้านอาหารของคุณ..."
              InputLabelProps={{
                shrink: !!formData.restaurantDescription || undefined
              }}
            />
            <TextField
              fullWidth
              label="ที่อยู่ร้าน"
              value={formData.restaurantAddress}
              onChange={(e) => handleInputChange('restaurantAddress', e.target.value)}
              required
              multiline
              rows={2}
              placeholder="เลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              InputLabelProps={{
                shrink: !!formData.restaurantAddress || undefined
              }}
            />
            <TextField
              fullWidth
              label="เบอร์โทรศัพท์ร้าน"
              value={formData.restaurantPhone}
              onChange={(e) => handleInputChange('restaurantPhone', e.target.value)}
              required
              placeholder="0xx-xxx-xxxx"
              inputProps={{ 
                maxLength: 12,
                inputMode: 'tel',
                pattern: '[0-9]*'
              }}
              error={formData.restaurantPhone !== '' && !isValidPhoneNumber(formData.restaurantPhone)}
              helperText={formData.restaurantPhone !== '' && !isValidPhoneNumber(formData.restaurantPhone) ? 'รูปแบบเบอร์โทรไม่ถูกต้อง' : 'เบอร์มือถือไทย 10 หลัก'}
              InputLabelProps={{
                shrink: !!formData.restaurantPhone || undefined
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
            <TextField
              fullWidth
              label="อีเมลร้าน (ถ้ามี)"
              type="email"
              value={formData.restaurantEmail}
              onChange={(e) => handleInputChange('restaurantEmail', e.target.value)}
              placeholder="contact@restaurant.com"
              InputLabelProps={{
                shrink: !!formData.restaurantEmail || undefined
              }}
            />
            
            {/* Location Picker */}
            <LocationPicker
              value={formData.location}
              onChange={(location) => {
                // Update location and sync address
                const updatedLocation = {
                  ...location,
                  address: formData.restaurantAddress || location.address
                };
                handleInputChange('location', updatedLocation);
              }}
              required
            />
          </Stack>
        )

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" color="primary">
              ข้อมูลธุรกิจ
            </Typography>
            <TextField
              fullWidth
              label="เลขประจำตัวผู้เสียภาษี"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              required
              inputProps={{ maxLength: 13 }}
              placeholder="1234567890123"
              helperText="เลขประจำตัวผู้เสียภาษี 13 หลัก"
              InputLabelProps={{
                shrink: !!formData.taxId || undefined
              }}
            />
            <TextField
              fullWidth
              label="ชื่อธนาคาร"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              required
              placeholder="ธนาคารไทยพาณิชย์"
              InputLabelProps={{
                shrink: !!formData.bankName || undefined
              }}
            />
            <TextField
              fullWidth
              label="เลขบัญชีธนาคาร"
              value={formData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              required
              placeholder="1234567890"
              InputLabelProps={{
                shrink: !!formData.bankAccount || undefined
              }}
            />
          </Stack>
        )

      case 3:
        return (
          <Stack spacing={4}>
            <Typography variant="h6" color="primary">
              อัพโหลดเอกสาร
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กรุณาอัพโหลดเอกสารที่จำเป็นสำหรับการสมัครเป็นพาร์ทเนอร์ร้านอาหาร
            </Typography>
            
                        {/* Minimal Multi-File Upload */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 2,
              p: 2,
              border: '1px solid',
              borderColor: formData.documents.length > 0 ? 'success.main' : 'grey.300',
              borderRadius: 2,
              bgcolor: formData.documents.length > 0 ? 'success.50' : 'grey.50',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.25'
              }
            }}>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  handleInputChange('documents', files)
                }}
                style={{ display: 'none' }}
                id="documents-upload"
              />
              
              {/* Icon */}
              <Box sx={{ 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'primary.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                height: 36
              }}>
                📄
              </Box>
              
              {/* Text Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  อัพโหลดเอกสาร
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {formData.documents.length > 0 
                    ? `เลือกแล้ว ${formData.documents.length} ไฟล์` 
                    : 'รองรับ: รูปภาพ, PDF, Word'
                  }
                </Typography>
              </Box>
              
              {/* Browse Button */}
              <label htmlFor="documents-upload">
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    cursor: 'pointer'
                  }}
                >
                  เลือกไฟล์
                </Button>
              </label>
            </Box>

            {/* Preview uploaded files */}
            {formData.documents.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom color="success.main">
                  ไฟล์ที่อัพโหลด ({formData.documents.length} ไฟล์)
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: 2 
                }}>
                  {formData.documents.map((file, index) => (
                    <Box key={index}>
                      <Card sx={{ 
                        p: 2, 
                        height: '100%',
                        border: '1px solid',
                        borderColor: 'success.200',
                        bgcolor: 'success.50'
                      }}>
                        <Stack spacing={2} alignItems="center">
                          {file.type.startsWith('image/') ? (
                            <Box
                              component="img"
                              src={file.preview}
                              alt={file.name}
                              sx={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 2
                              }}
                            />
                          ) : (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: '100%',
                              height: 120,
                              bgcolor: 'grey.100',
                              borderRadius: 2
                            }}>
                              <Typography variant="h3">📄</Typography>
            </Box>
                          )}
                          <Box sx={{ textAlign: 'center', width: '100%' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              const newDocuments = formData.documents.filter((_, i) => i !== index)
                              // Cleanup preview URL
                              if (file.preview) {
                                URL.revokeObjectURL(file.preview)
                              }
                              handleInputChange('documents', newDocuments)
                            }}
                          >
                            ลบ
                          </Button>
                        </Stack>
                                             </Card>
                     </Box>
                   ))}
                 </Box>
              </Box>
            )}
          </Stack>
        )

      case 4:
        return (
          <Stack spacing={4}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 600, textAlign: 'center' }}>
              ยืนยันข้อมูลการสมัคร
            </Typography>
            
            {/* ข้อมูลส่วนตัว */}
            <Box sx={{ 
              p: { xs: 3, sm: 4 }, 
              bgcolor: 'primary.50', 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <Typography 
                variant="h6" 
                color="primary.main" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 2
                }}
              >
                👤 ข้อมูลส่วนตัว
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 80 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    ชื่อ:
              </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 }
                    }}
                  >
                    {formData.name}
              </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 80 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    อีเมล:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 },
                      wordBreak: 'break-word'
                    }}
                  >
                    {formData.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* ข้อมูลร้านอาหาร */}
            <Box sx={{ 
              p: { xs: 3, sm: 4 }, 
              bgcolor: 'success.50', 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'success.200'
            }}>
              <Typography 
                variant="h6" 
                color="success.main" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 2
                }}
              >
                🏪 ข้อมูลร้านอาหาร
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 100 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    ชื่อร้าน:
              </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 }
                    }}
                  >
                    {formData.restaurantName}
              </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Typography 
                    variant="body1" 
                sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 100 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    เบอร์โทร:
              </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 }
                    }}
                  >
                    {formData.restaurantPhone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      mb: 0.5
                    }}
                  >
                    ที่อยู่:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      pl: { sm: 2 }
                    }}
                  >
                    {formData.restaurantAddress}
                  </Typography>
                </Box>
              {formData.location.latitude && formData.location.longitude && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'success.100', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'success.300'
                  }}>
                <Typography 
                      variant="body1" 
                  sx={{ 
                        fontSize: { xs: '1rem', sm: '1rem' },
                        fontWeight: 500,
                        color: 'success.dark',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      📍 ตำแหน่งที่เลือก: {formData.location.locationName}
                </Typography>
                  </Box>
              )}
              </Stack>
            </Box>

            {/* ข้อมูลธุรกิจ */}
            <Box sx={{ 
              p: { xs: 3, sm: 4 }, 
              bgcolor: 'info.50', 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'info.200'
            }}>
              <Typography 
                variant="h6" 
                color="info.main" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 2
                }}
              >
                💼 ข้อมูลธุรกิจ
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Typography 
                    variant="body1" 
                sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 120 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    เลขประจำตัวผู้เสียภาษี:
              </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 },
                      fontFamily: 'monospace'
                    }}
                  >
                    {formData.taxId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 120 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    ธนาคาร:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 }
                    }}
                  >
                    {formData.bankName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500,
                      color: 'text.secondary',
                      minWidth: { sm: 120 },
                      mb: { xs: 0.5, sm: 0 }
                    }}
                  >
                    เลขบัญชี:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 400,
                      ml: { sm: 2 },
                      fontFamily: 'monospace'
                    }}
                  >
                    {formData.bankAccount}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* เอกสารที่อัพโหลด */}
            <Box sx={{ 
              p: { xs: 3, sm: 4 }, 
              bgcolor: 'warning.50', 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'warning.200'
            }}>
              <Typography 
                variant="h6" 
                color="warning.main" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                📋 เอกสารที่อัพโหลด
              </Typography>
              
              {formData.documents.length > 0 ? (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 2 
                }}>
                  {formData.documents.map((file, index) => (
                    <Card key={index} sx={{ 
                      p: 2, 
                      height: 'auto',
                      border: '1px solid',
                      borderColor: 'warning.300',
                      bgcolor: 'warning.50'
                    }}>
                      <Stack spacing={1} alignItems="center">
                        {file.type.startsWith('image/') ? (
                          <Box
                            component="img"
                            src={file.preview}
                            alt={file.name}
                            sx={{
                              width: '100%',
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            height: 80,
                            bgcolor: 'grey.100',
                            borderRadius: 1
                          }}>
                            <Typography variant="h4">📄</Typography>
                          </Box>
                        )}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 500,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                        >
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Stack>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  ไม่มีเอกสารที่อัพโหลด
                </Typography>
              )}

              {/* Summary Info */}
              <Box sx={{ 
                mt: 3,
                p: 2,
                bgcolor: 'rgba(255, 193, 7, 0.1)',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'warning.main'
              }}>
              <Typography 
                variant="body2" 
                sx={{ 
                    fontSize: { xs: '0.9rem', sm: '0.9rem' },
                    color: 'warning.dark',
                    textAlign: 'center',
                    fontWeight: 500
                  }}
                >
                  📌 เอกสารทั้งหมด: {formData.documents.length} ไฟล์
              </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'grey.300', borderWidth: 1 }} />

            {/* ข้อกำหนดและเงื่อนไข */}
            <Box sx={{ 
              p: { xs: 3, sm: 4 }, 
              bgcolor: 'grey.50', 
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'grey.200'
            }}>
              <Typography 
                variant="h6" 
                color="text.primary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                📝 การยอมรับเงื่อนไข
              </Typography>
              
              <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      sx={{ 
                        p: { xs: 1, sm: '9px' },
                        '& .MuiSvgIcon-root': { fontSize: '1.5rem' }
                      }}
                  />
                }
                label={
                  <Typography 
                      variant="body1" 
                    sx={{ 
                        fontSize: { xs: '1rem', sm: '1rem' },
                        lineHeight: 1.6,
                        fontWeight: 400
                      }}
                    >
                      ฉันได้อ่านและยอมรับ{' '}
                      <MuiLink 
                        href="#" 
                        underline="hover"
                        sx={{ 
                          fontWeight: 600,
                          color: 'primary.main',
                          fontSize: { xs: '1rem', sm: '1rem' }
                        }}
                      >
                        ข้อกำหนดและเงื่อนไขการใช้บริการ
                    </MuiLink>
                  </Typography>
                }
                  sx={{ 
                    alignItems: 'flex-start',
                    mb: 1
                  }}
              />
                
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToPrivacy}
                    onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                      sx={{ 
                        p: { xs: 1, sm: '9px' },
                        '& .MuiSvgIcon-root': { fontSize: '1.5rem' }
                      }}
                  />
                }
                label={
                  <Typography 
                      variant="body1" 
                    sx={{ 
                        fontSize: { xs: '1rem', sm: '1rem' },
                        lineHeight: 1.6,
                        fontWeight: 400
                      }}
                    >
                      ฉันได้อ่านและยอมรับ{' '}
                      <MuiLink 
                        href="#" 
                        underline="hover"
                        sx={{ 
                          fontWeight: 600,
                          color: 'primary.main',
                          fontSize: { xs: '1rem', sm: '1rem' }
                        }}
                      >
                      นโยบายความเป็นส่วนตัว
                    </MuiLink>
                  </Typography>
                }
                  sx={{ 
                    alignItems: 'flex-start'
                  }}
              />
            </Stack>
            </Box>
          </Stack>
        )

      default:
        return null
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }
    }}>
      <NotificationComponent />
      
      <Container maxWidth="lg" sx={{ 
        py: { xs: 3, sm: 6 }, 
        px: { xs: 2, sm: 3 },
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          borderRadius: { xs: 3, sm: 4 },
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
          }
        }}>
          <Box sx={{ p: { xs: 3, sm: 5 } }}>
          {/* Header - Glass Morphism Style */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            mb: { xs: 4, sm: 6 },
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Logo with glow effect */}
            <Box sx={{ 
              mb: 3,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: -1,
                animation: 'pulse 3s ease-in-out infinite'
              },
              '@keyframes pulse': {
                '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.5 },
                '50%': { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0.8 }
              }
            }}>
              <Image 
                src="/images/logo_trim.png" 
                alt="RedPotion Logo" 
                width={100} 
                height={80}
                style={{ 
                  width: 'auto', 
                  height: 'auto', 
                  maxWidth: '100px',
                  maxHeight: '80px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
              />
            </Box>

            {/* Title with gradient */}
            <Box sx={{ position: 'relative' }}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                  lineHeight: 1.2,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                เข้าร่วมเป็นพาร์ทเนอร์
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 400, 
                  fontSize: { xs: '1.1rem', sm: '1.5rem' },
                  color: 'rgba(0, 0, 0, 0.7)',
                  mb: 3
                }}
              >
                ร้านอาหารของคุณ
              </Typography>
              
              {/* Subtitle */}
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  color: 'rgba(0, 0, 0, 0.6)',
                  maxWidth: '500px',
                  lineHeight: 1.6,
                  fontWeight: 300
                }}
              >
                เริ่มต้นการเดินทางในการขายอาหารออนไลน์ สร้างรายได้ และเข้าถึงลูกค้าใหม่ๆ
              </Typography>
            </Box>
          </Box>

          {/* Stepper - Glass Morphism Style */}
          <Box sx={{ mb: { xs: 4, sm: 5 } }}>
            {/* Mobile Stepper */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Box sx={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                p: 3,
                textAlign: 'center'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                ขั้นตอน {activeStep + 1} จาก {steps.length}
              </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#10B981',
                    mb: 3,
                    fontSize: '1.1rem'
                  }}
                >
                {steps[activeStep]}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                  gap: 1.5
              }}>
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                        width: 10,
                        height: 10,
                      borderRadius: '50%',
                        background: index <= activeStep 
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: index === activeStep ? 'scale(1.3)' : 'scale(1)',
                        boxShadow: index <= activeStep 
                          ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                          : 'none'
                    }}
                  />
                ))}
                </Box>
              </Box>
            </Box>

            {/* Desktop Stepper */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                p: 4
              }}>
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                '& .MuiStepLabel-label': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'rgba(0, 0, 0, 0.7)',
                      '&.Mui-active': {
                        color: '#10B981',
                        fontWeight: 600
                      },
                      '&.Mui-completed': {
                        color: '#059669',
                        fontWeight: 500
                      }
                    },
                    '& .MuiStepIcon-root': {
                      fontSize: '1.5rem',
                      '&.Mui-active': {
                        color: '#10B981'
                      },
                      '&.Mui-completed': {
                        color: '#059669'
                      }
                    },
                    '& .MuiStepConnector-line': {
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      borderTopWidth: 2
                    },
                    '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                      borderColor: '#10B981'
                    },
                    '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                      borderColor: '#059669'
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
              </Box>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form Content */}
          <Box sx={{ 
            mb: { xs: 4, sm: 5 },
            '@keyframes labelFloat': {
              '0%': {
                transform: 'translate(14px, 16px) scale(1)',
                opacity: 0.7
              },
              '100%': {
                transform: 'translate(14px, -10px) scale(0.75)',
                opacity: 1
              }
            },
            '@keyframes labelSink': {
              '0%': {
                transform: 'translate(14px, -10px) scale(0.75)',
                opacity: 1
              },
              '100%': {
                transform: 'translate(14px, 16px) scale(1)',
                opacity: 0.7
              }
            },
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 1.5,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'background-color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                position: 'relative',
                willChange: 'transform, background-color, border-color, box-shadow',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderColor: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2), 0 4px 16px rgba(16, 185, 129, 0.1)',
                  transform: 'translateY(-2px)'
                },
                '& fieldset': {
                  border: 'none'
                },
                                  '& input': {
                    padding: '16px 14px',
                    fontSize: '1rem',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)'
                  },
                  '& textarea': {
                    padding: '16px 14px',
                    fontSize: '1rem',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)'
                  }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(0, 0, 0, 0.7)',
                fontWeight: 500,
                fontSize: '1rem',
                position: 'absolute',
                left: 0,
                top: 0,
                transform: 'translate(14px, 16px) scale(1)',
                transformOrigin: 'top left',
                opacity: 0.7,
                transition: 'color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), padding 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                zIndex: 2,
                pointerEvents: 'none',
                willChange: 'transform, color, background-color, opacity',
                '&.Mui-focused': {
                  color: '#10B981',
                  transform: 'translate(14px, -10px) scale(0.75)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  opacity: 1
                },
                '&.MuiFormLabel-filled': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  transform: 'translate(14px, -10px) scale(0.75)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                  opacity: 1
                }
              },
              '& .MuiInputLabel-shrink': {
                color: 'rgba(0, 0, 0, 0.6)',
                transform: 'translate(14px, -10px) scale(0.75)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 8px',
                borderRadius: '6px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                opacity: 1,
                transition: 'color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), padding 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                '&.Mui-focused': {
                  color: '#10B981',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  opacity: 1
                }
              }
            }
          }}>
            <Box sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: { xs: 3, sm: 4 },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
              }
            }}>
            {renderStepContent(activeStep)}
            </Box>
          </Box>

          {/* Navigation Buttons - Glass Morphism Style */}
          <Box sx={{ 
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            p: { xs: 3, sm: 4 },
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { sm: 'space-between' }, 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 3, sm: 0 }
          }}>
            {/* Back Button */}
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBack />}
              sx={{ 
                order: { xs: 2, sm: 1 },
                minHeight: { xs: 50, sm: 44 },
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                color: 'rgba(0, 0, 0, 0.7)',
                fontWeight: 500,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.6)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              ย้อนกลับ
            </Button>

            {/* Right Side Buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 3 },
              order: { xs: 1, sm: 2 }
            }}>
              {/* Sign In Link - Mobile จะซ่อน */}
              <Link href="/auth/signin" passHref>
                <Button 
                  variant="text" 
                  disabled={loading}
                  sx={{ 
                    display: { xs: 'none', sm: 'inline-flex' },
                    minHeight: 44,
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    borderRadius: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      color: '#10B981',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </Button>
              </Link>

              {/* Main Action Button */}
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Check />}
                  size="large"
                  sx={{ 
                    minHeight: { xs: 56, sm: 48 },
                    fontSize: { xs: '1.1rem', sm: '1rem' },
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: 2.5,
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(16, 185, 129, 0.3)',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  size="large"
                  disabled={loading}
                  sx={{ 
                    minHeight: { xs: 56, sm: 48 },
                    fontSize: { xs: '1.1rem', sm: '1rem' },
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: 2.5,
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(16, 185, 129, 0.3)',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  ถัดไป
                </Button>
              )}
            </Box>
          </Box>

          {/* Mobile Sign In Link */}
          <Box sx={{ 
            display: { xs: 'block', sm: 'none' }, 
            mt: 3
          }}>
            <Box sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: 3,
              textAlign: 'center'
          }}>
            <Link href="/auth/signin" passHref>
                <Button 
                  variant="text" 
                  sx={{
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      color: '#10B981',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
              </Button>
            </Link>
          </Box>
          </Box>
          </Box>
        </Box>
    </Container>
    </Box>
  )
} 