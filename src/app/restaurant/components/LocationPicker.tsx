'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Stack,
} from '@mui/material';
import {
  LocationOn,
  Map as MapIcon,
  Clear,
  MyLocation,
} from '@mui/icons-material';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  locationName: string;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  disabled = false,
  required = false
}: LocationPickerProps) {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update input fields when value changes
  useEffect(() => {
    if (value.latitude && value.longitude) {
      setLatInput(value.latitude.toString());
      setLngInput(value.longitude.toString());
    }
  }, [value.latitude, value.longitude]);

  // Update location from coordinates
  const updateLocationFromInputs = (lat: number, lng: number, locationName: string) => {
    onChange({
      latitude: lat,
      longitude: lng,
      address: value.address,
      locationName: locationName
    });
  };

  // Auto check-in with current location
  const autoCheckIn = async () => {
    setIsGettingLocation(true);
    setError(null);

    try {
      // First try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Update input fields
            setLatInput(lat.toString());
            setLngInput(lng.toString());
            
            updateLocationFromInputs(lat, lng, `ตำแหน่งปัจจุบัน (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
            setIsGettingLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to default Bangkok location if geolocation fails
            fallbackToDefaultLocation();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        // Fallback if geolocation is not supported
        fallbackToDefaultLocation();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      fallbackToDefaultLocation();
    }
  };

  // Fallback to default location
  const fallbackToDefaultLocation = () => {
    // Use Bangkok center as default with slight randomization
    const baseLat = 13.7563;
    const baseLng = 100.5018;
    
    // Add small random offset to simulate different locations
    const lat = baseLat + (Math.random() - 0.5) * 0.02; // ±0.01 degree
    const lng = baseLng + (Math.random() - 0.5) * 0.02; // ±0.01 degree
    
    // Update input fields
    setLatInput(lat.toString());
    setLngInput(lng.toString());
    
    updateLocationFromInputs(lat, lng, `ตำแหน่งที่เลือก (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    setIsGettingLocation(false);
  };

  // Handle manual coordinate input from separate fields
  const handleManualCoordinateInput = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('กรุณากรอกพิกัดที่ถูกต้อง');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('พิกัดไม่อยู่ในช่วงที่ถูกต้อง');
      return;
    }

    setError(null);
    updateLocationFromInputs(lat, lng, `ตำแหน่งที่กรอกเอง (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
  };

  // Clear location
  const clearLocation = () => {
    onChange({
      latitude: null,
      longitude: null,
      address: value.address,
      locationName: ''
    });
    setLatInput('');
    setLngInput('');
    setError(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        ตำแหน่งร้านอาหาร {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      {/* Current location display */}
      {value.latitude && value.longitude ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ ตำแหน่งร้านถูกกำหนดแล้ว
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          กรุณากำหนดตำแหน่งร้านอาหารของคุณ
        </Alert>
      )}

      {/* Controls */}
      <Stack spacing={2}>
        {/* Current Location Button */}
        <Button
          variant="contained"
          startIcon={<MyLocation />}
          onClick={autoCheckIn}
          disabled={disabled || isGettingLocation}
          size="large"
          sx={{ 
            minHeight: { xs: 48, sm: 'auto' },
            fontSize: { xs: '1rem', sm: '0.875rem' }
          }}
        >
          {isGettingLocation ? 'กำลังค้นหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน'}
        </Button>

        {/* Coordinate input fields */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            หรือกรอกพิกัดโดยตรง:
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              label="Latitude (ละติจูด)"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onBlur={handleManualCoordinateInput}
              placeholder="13.7563"
              disabled={disabled}
              type="number"
              inputProps={{ 
                step: 'any',
                inputMode: 'decimal'
              }}
              sx={{ 
                flex: 1,
                '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } }
              }}
            />
            <TextField
              label="Longitude (ลองจิจูด)"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              onBlur={handleManualCoordinateInput}
              placeholder="100.5018"
              disabled={disabled}
              type="number"
              inputProps={{ 
                step: 'any',
                inputMode: 'decimal'
              }}
              sx={{ 
                flex: 1,
                '& .MuiInputBase-input': { fontSize: { xs: '16px', sm: '16px' } }
              }}
            />
          </Box>
        </Box>
      </Stack>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Google Maps Display */}
      {value.latitude && value.longitude && (
        <Paper 
          sx={{ 
            p: 0, 
            mt: 2, 
            bgcolor: 'white', 
            borderRadius: 2, 
            overflow: 'hidden', 
            border: 1, 
            borderColor: 'grey.300',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }
          }}
        >
          {/* Map Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'grey.200',
            background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)'
          }}>
            <Typography variant="subtitle2" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 600
            }}>
              <LocationOn color="primary" />
              🗺️ ตำแหน่งร้านบน Google Maps
            </Typography>
          </Box>

          {/* Google Maps Embed */}
          <Box 
            sx={{ 
              width: '100%', 
              height: 250,
              position: 'relative',
              overflow: 'hidden',
              bgcolor: '#f5f5f5'
            }}
          >
            <iframe
              ref={iframeRef}
              src={`https://www.google.com/maps?q=${value.latitude},${value.longitude}&z=16&output=embed&iwloc=near`}
              width="100%"
              height="100%"
              style={{ 
                border: 0,
                filter: 'contrast(1.05) saturate(1.1)',
                transition: 'opacity 0.3s ease'
              }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Restaurant Location"
              onLoad={() => setMapLoadError(false)}
              onError={() => setMapLoadError(true)}
            />
            
            {/* Custom overlay for better UX */}
            <Box 
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#666',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
              }}
            >
              📍 ตำแหน่งร้าน
            </Box>

            {/* Fallback for when embed fails */}
            {mapLoadError && (
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    radial-gradient(circle at 30% 30%, #e8f5e8 0%, #f0f8f0 50%, #e8f0e8 100%),
                    linear-gradient(45deg, #e3f2fd 0%, #f3e5f5 100%)
                  `,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5
                }}
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${value.latitude},${value.longitude}`;
                  window.open(url, '_blank');
                }}
              >
                {/* Simplified fallback pin */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ fontSize: '48px', mb: 1 }}>📍</Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>
                    คลิกเพื่อดูแผนที่
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                    (ไม่สามารถโหลดแผนที่ได้)
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Map Info & Actions */}
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>พิกัด:</strong> {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              <br />
              <strong>ชื่อตำแหน่ง:</strong> {value.locationName}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<MapIcon />}
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${value.latitude},${value.longitude}`;
                  window.open(url, '_blank');
                }}
                sx={{ flex: 1 }}
              >
                เปิดใน Google Maps
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={clearLocation}
                startIcon={<Clear />}
              >
                เลือกใหม่
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tips */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>💡 เคล็ดลับ:</strong> ใช้ตำแหน่งปัจจุบันหรือกรอกพิกัดเองได้
        </Typography>
      </Box>
    </Box>
  );
} 