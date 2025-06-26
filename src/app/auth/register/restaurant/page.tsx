'use client'

import { useState } from 'react'
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
  
  // Documents (เหลือแค่ 2 ไฟล์)
  ownerIdCard: FileWithPreview | null;
  bankStatement: FileWithPreview | null;
  
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
    ownerIdCard: null,
    bankStatement: null,
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
        if (!formData.ownerIdCard) {
          showError('กรุณาอัพโหลดสำเนาบัตรประชาชนเจ้าของร้าน')
          return false
        }
        if (!formData.bankStatement) {
          showError('กรุณาอัพโหลดหนังสือรับรองบัญชีธนาคาร')
          return false
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

  const uploadFile = async (file: FileWithPreview, category: string): Promise<string | null> => {
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
      return result.url
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
      // Upload files
      let ownerIdCardUrl: string | null = null
      let bankStatementUrl: string | null = null

      if (formData.ownerIdCard) {
        ownerIdCardUrl = await uploadFile(formData.ownerIdCard, 'owner-id')
      }

      if (formData.bankStatement) {
        bankStatementUrl = await uploadFile(formData.bankStatement, 'bank-statement')
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
          ownerIdCard: ownerIdCardUrl,
          bankStatement: bankStatementUrl,
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
            />
            <TextField
              fullWidth
              label="คำอธิบายร้าน"
              value={formData.restaurantDescription}
              onChange={(e) => handleInputChange('restaurantDescription', e.target.value)}
              multiline
              rows={3}
              placeholder="อธิบายเกี่ยวกับร้านอาหารของคุณ..."
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
              sx={{ '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } } }}
            />
            <TextField
              fullWidth
              label="อีเมลร้าน (ถ้ามี)"
              type="email"
              value={formData.restaurantEmail}
              onChange={(e) => handleInputChange('restaurantEmail', e.target.value)}
              placeholder="contact@restaurant.com"
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
            />
            <TextField
              fullWidth
              label="ชื่อธนาคาร"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              required
              placeholder="ธนาคารไทยพาณิชย์"
            />
            <TextField
              fullWidth
              label="เลขบัญชีธนาคาร"
              value={formData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              required
              placeholder="1234567890"
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
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: { xs: 3, sm: 3 }
            }}>
              <MinimalFileUpload
                file={formData.ownerIdCard}
                onFileChange={(file) => handleInputChange('ownerIdCard', file)}
                label="สำเนาบัตรประชาชนเจ้าของร้าน"
                required
              />
              <MinimalFileUpload
                file={formData.bankStatement}
                onFileChange={(file) => handleInputChange('bankStatement', file)}
                label="หนังสือรับรองบัญชีธนาคาร"
                required
              />
            </Box>
          </Stack>
        )

      case 4:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" color="primary">
              ยืนยันข้อมูล
            </Typography>
            
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              mb: { xs: 2, sm: 0 }
            }}>
              <Typography variant="subtitle2" gutterBottom>
                ข้อมูลส่วนตัว
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                ชื่อ: {formData.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                อีเมล: {formData.email}
              </Typography>
            </Box>

            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              mb: { xs: 2, sm: 0 }
            }}>
              <Typography variant="subtitle2" gutterBottom>
                ข้อมูลร้านอาหาร
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                ชื่อร้าน: {formData.restaurantName}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                เบอร์โทร: {formData.restaurantPhone}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  wordBreak: 'break-word'
                }}
              >
                ที่อยู่: {formData.restaurantAddress}
              </Typography>
              {formData.location.latitude && formData.location.longitude && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    color: 'success.main',
                    mt: 1
                  }}
                >
                  📍 ตำแหน่ง: {formData.location.locationName}
                </Typography>
              )}
            </Box>

            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              mb: { xs: 2, sm: 0 }
            }}>
              <Typography variant="subtitle2" gutterBottom>
                เอกสารที่อัพโหลด
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  wordBreak: 'break-word'
                }}
              >
                ✓ สำเนาบัตรประชาชน: {formData.ownerIdCard?.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  wordBreak: 'break-word'
                }}
              >
                ✓ หนังสือรับรองบัญชีธนาคาร: {formData.bankStatement?.name}
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    sx={{ p: { xs: 1, sm: '9px' } }}
                  />
                }
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      lineHeight: 1.4
                    }}
                  >
                    ฉันยอมรับ{' '}
                    <MuiLink href="#" underline="hover">
                      ข้อกำหนดและเงื่อนไข
                    </MuiLink>
                  </Typography>
                }
                sx={{ alignItems: 'flex-start' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToPrivacy}
                    onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                    sx={{ p: { xs: 1, sm: '9px' } }}
                  />
                }
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                      lineHeight: 1.4
                    }}
                  >
                    ฉันยอมรับ{' '}
                    <MuiLink href="#" underline="hover">
                      นโยบายความเป็นส่วนตัว
                    </MuiLink>
                  </Typography>
                }
                sx={{ alignItems: 'flex-start' }}
              />
            </Stack>
          </Stack>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
      <NotificationComponent />
      
      <Card sx={{ borderRadius: { xs: 0, sm: 2 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {/* Header - รองรับมือถือ */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' }, 
            mb: { xs: 3, sm: 4 },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Box sx={{ mb: { xs: 2, sm: 0 }, mr: { sm: 2 } }}>
              <Image 
                src="/images/logo_trim.png" 
                alt="logo" 
                width={120} 
                height={80}
                style={{ 
                  width: 'auto', 
                  height: 'auto', 
                  maxWidth: '120px',
                  maxHeight: '80px'
                }}
              />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: '400', 
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  lineHeight: 1.2
                }}
              >
                สมัครเป็นพาร์ทเนอร์ร้านอาหาร
              </Typography>
            </Box>
          </Box>

          {/* Stepper - รองรับมือถือ */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            {/* Mobile Stepper */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                ขั้นตอน {activeStep + 1} จาก {steps.length}
              </Typography>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                {steps[activeStep]}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: 1,
                mb: 2
              }}>
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Desktop Stepper */}
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                '& .MuiStepLabel-label': {
                  fontSize: { sm: '0.875rem', md: '1rem' }
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form Content */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons - รองรับมือถือ */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { sm: 'space-between' }, 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 2, sm: 0 }
          }}>
            {/* Back Button */}
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBack />}
              sx={{ 
                order: { xs: 2, sm: 1 },
                minHeight: { xs: 48, sm: 'auto' }
              }}
            >
              ย้อนกลับ
            </Button>

            {/* Right Side Buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 },
              order: { xs: 1, sm: 2 }
            }}>
              {/* Sign In Link - Mobile จะซ่อน */}
              <Link href="/auth/signin" passHref>
                <Button 
                  variant="text" 
                  disabled={loading}
                  sx={{ 
                    display: { xs: 'none', sm: 'inline-flex' },
                    minHeight: { xs: 48, sm: 'auto' }
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
                  endIcon={loading ? <CircularProgress size={20} /> : <Check />}
                  size="large"
                  sx={{ 
                    minHeight: { xs: 48, sm: 'auto' },
                    fontSize: { xs: '1rem', sm: '0.875rem' }
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
                    minHeight: { xs: 48, sm: 'auto' },
                    fontSize: { xs: '1rem', sm: '0.875rem' }
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
            textAlign: 'center', 
            mt: 2,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Link href="/auth/signin" passHref>
              <Button variant="text" size="small">
                มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
} 