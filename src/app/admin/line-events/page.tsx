'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  Tab,
  Tabs,
  TablePagination,
  Tooltip,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Message,
  Person,
  Visibility,
  Refresh,
  Search,
  PersonAdd,
  Event,
  FilterList,
  Download,
} from '@mui/icons-material';

interface LineWebhookEvent {
  id: string;
  eventType: string;
  lineUserId: string;
  messageType?: string;
  messageText?: string;
  timestamp: string;
  isProcessed: boolean;
  errorMessage?: string;
  lineUserProfile?: {
    displayName?: string;
    pictureUrl?: string;
  };
}

interface LineUserProfile {
  id: string;
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  isFollowing: boolean;
  lastActiveAt?: string;
  followedAt?: string;
  user?: {
    name?: string;
    email?: string;
    role: string;
  };
  restaurant?: {
    name: string;
    status: string;
  };
  _count?: {
    webhookEvents: number;
  };
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LineEventsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<LineWebhookEvent[]>([]);
  const [profiles, setProfiles] = useState<LineUserProfile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<LineWebhookEvent | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<LineUserProfile | null>(null);
  
  // Pagination
  const [eventsPage, setEventsPage] = useState(0);
  const [eventsRowsPerPage, setEventsRowsPerPage] = useState(25);
  const [profilesPage, setProfilesPage] = useState(0);
  const [profilesRowsPerPage, setProfilesRowsPerPage] = useState(25);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalProfiles, setTotalProfiles] = useState(0);
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (tabValue === 0) {
      loadEvents();
    } else {
      loadProfiles();
    }
  }, [tabValue, eventsPage, eventsRowsPerPage, profilesPage, profilesRowsPerPage, eventTypeFilter, statusFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: eventsRowsPerPage.toString(),
        offset: (eventsPage * eventsRowsPerPage).toString(),
        ...(eventTypeFilter && { eventType: eventTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/line-events?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
        setTotalEvents(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: profilesRowsPerPage.toString(),
        offset: (profilesPage * profilesRowsPerPage).toString(),
      });

      const response = await fetch(`/api/line/user-profile?${params}`);
      const data = await response.json();

      if (data.success) {
        setProfiles(data.data);
        setTotalProfiles(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (tabValue === 0) {
      loadEvents();
    } else {
      loadProfiles();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'MESSAGE': return 'primary';
      case 'FOLLOW': return 'success';
      case 'UNFOLLOW': return 'error';
      case 'POSTBACK': return 'info';
      default: return 'default';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <Message />;
      case 'FOLLOW': return <PersonAdd />;
      case 'UNFOLLOW': return <Person />;
      default: return <Event />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('th-TH');
  };

  const createUserProfile = async (lineUserId: string) => {
    try {
      const response = await fetch('/api/line/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineUserId, force: true }),
      });

      const data = await response.json();
      if (data.success) {
        refreshData();
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Message />
          LINE Events & Users
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          onClick={refreshData}
          disabled={loading}
        >
          รีเฟรช
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="line events tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={totalEvents} color="primary" max={999}>
                Webhook Events
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={totalProfiles} color="secondary" max={999}>
                User Profiles
              </Badge>
            } 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Filters for Events */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ประเภท Event</InputLabel>
              <Select
                value={eventTypeFilter}
                label="ประเภท Event"
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="MESSAGE">Message</MenuItem>
                <MenuItem value="FOLLOW">Follow</MenuItem>
                <MenuItem value="UNFOLLOW">Unfollow</MenuItem>
                <MenuItem value="POSTBACK">Postback</MenuItem>
                <MenuItem value="OTHER">อื่นๆ</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="processed">ประมวลผลแล้ว</MenuItem>
                <MenuItem value="error">มี Error</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>เวลา</TableCell>
                  <TableCell>ประเภท</TableCell>
                  <TableCell>ผู้ใช้</TableCell>
                  <TableCell>ข้อความ</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getEventTypeIcon(event.eventType)}
                        label={event.eventType}
                        color={getEventTypeColor(event.eventType) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {event.lineUserProfile?.pictureUrl && (
                          <Avatar
                            src={event.lineUserProfile.pictureUrl}
                            sx={{ width: 32, height: 32 }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2">
                            {event.lineUserProfile?.displayName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.lineUserId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {event.messageText ? (
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.messageText}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {event.messageType || '-'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.errorMessage ? (
                        <Chip label="Error" color="error" size="small" />
                      ) : event.isProcessed ? (
                        <Chip label="ประมวลผลแล้ว" color="success" size="small" />
                      ) : (
                        <Chip label="รอประมวลผล" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="ดูรายละเอียด">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalEvents}
            page={eventsPage}
            onPageChange={(_, newPage) => setEventsPage(newPage)}
            rowsPerPage={eventsRowsPerPage}
            onRowsPerPageChange={(e) => {
              setEventsRowsPerPage(parseInt(e.target.value, 10));
              setEventsPage(0);
            }}
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ผู้ใช้</TableCell>
                  <TableCell>สถานะการติดตาม</TableCell>
                  <TableCell>ผู้ใช้ในระบบ</TableCell>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>กิจกรรมล่าสุด</TableCell>
                  <TableCell>จำนวน Events</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={profile.pictureUrl}
                          sx={{ width: 40, height: 40 }}
                        >
                          {profile.displayName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {profile.displayName || 'ไม่ระบุชื่อ'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {profile.lineUserId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={profile.isFollowing ? 'กำลังติดตาม' : 'ไม่ติดตาม'}
                        color={profile.isFollowing ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {profile.user ? (
                        <Box>
                          <Typography variant="body2">
                            {profile.user.name || profile.user.email}
                          </Typography>
                          <Chip
                            label={profile.user.role}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          ไม่ได้เชื่อมต่อ
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.restaurant ? (
                        <Box>
                          <Typography variant="body2">
                            {profile.restaurant.name}
                          </Typography>
                          <Chip
                            label={profile.restaurant.status}
                            size="small"
                            color={profile.restaurant.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.lastActiveAt ? (
                        formatTimestamp(profile.lastActiveAt)
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          ไม่มีข้อมูล
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={profile._count?.webhookEvents || 0}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="ดูรายละเอียด">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalProfiles}
            page={profilesPage}
            onPageChange={(_, newPage) => setProfilesPage(newPage)}
            rowsPerPage={profilesRowsPerPage}
            onRowsPerPageChange={(e) => {
              setProfilesRowsPerPage(parseInt(e.target.value, 10));
              setProfilesPage(0);
            }}
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </TabPanel>
      </Paper>

      {/* Event Detail Dialog */}
      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>รายละเอียด Webhook Event</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event ID"
                  value={selectedEvent.id}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="ประเภท Event"
                  value={selectedEvent.eventType}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="LINE User ID"
                  value={selectedEvent.lineUserId}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="เวลา"
                  value={formatTimestamp(selectedEvent.timestamp)}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedEvent.messageType && (
                  <TextField
                    fullWidth
                    label="ประเภทข้อความ"
                    value={selectedEvent.messageType}
                    InputProps={{ readOnly: true }}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
                {selectedEvent.messageText && (
                  <TextField
                    fullWidth
                    label="ข้อความ"
                    value={selectedEvent.messageText}
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={3}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
                {selectedEvent.errorMessage && (
                  <TextField
                    fullWidth
                    label="ข้อความ Error"
                    value={selectedEvent.errorMessage}
                    InputProps={{ readOnly: true }}
                    error
                    multiline
                    rows={2}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Detail Dialog */}
      <Dialog
        open={Boolean(selectedProfile)}
        onClose={() => setSelectedProfile(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>รายละเอียด LINE User Profile</DialogTitle>
        <DialogContent>
          {selectedProfile && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={selectedProfile.pictureUrl}
                    sx={{ width: 60, height: 60 }}
                  >
                    {selectedProfile.displayName?.[0] || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedProfile.displayName || 'ไม่ระบุชื่อ'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProfile.lineUserId}
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="สถานะการติดตาม"
                  value={selectedProfile.isFollowing ? 'กำลังติดตาม' : 'ไม่ติดตาม'}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ mb: 2 }}
                />
                {selectedProfile.followedAt && (
                  <TextField
                    fullWidth
                    label="วันที่เริ่มติดตาม"
                    value={formatTimestamp(selectedProfile.followedAt)}
                    InputProps={{ readOnly: true }}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedProfile.user && (
                  <>
                    <TextField
                      fullWidth
                      label="ผู้ใช้ในระบบ"
                      value={selectedProfile.user.name || selectedProfile.user.email || 'ไม่ระบุ'}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="บทบาท"
                      value={selectedProfile.user.role}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
                {selectedProfile.restaurant && (
                  <>
                    <TextField
                      fullWidth
                      label="ร้านอาหาร"
                      value={selectedProfile.restaurant.name}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="สถานะร้าน"
                      value={selectedProfile.restaurant.status}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 