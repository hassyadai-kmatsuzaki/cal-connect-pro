import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Paper,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  WbSunny,
  NightsStay,
  Event,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ja from 'date-fns/locale/ja';
import TenantLayout from '../../layouts/TenantLayout';

interface WeekdaySchedule {
  day: string;
  enabled: boolean;
  startTime: Date | null;
  endTime: Date | null;
}

interface Holiday {
  id: string;
  date: Date;
  name: string;
  isRecurring: boolean;
}

const Availability: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekdaySchedule[]>([
    { day: '月曜日', enabled: true, startTime: new Date(2025, 0, 1, 9, 0), endTime: new Date(2025, 0, 1, 18, 0) },
    { day: '火曜日', enabled: true, startTime: new Date(2025, 0, 1, 9, 0), endTime: new Date(2025, 0, 1, 18, 0) },
    { day: '水曜日', enabled: true, startTime: new Date(2025, 0, 1, 9, 0), endTime: new Date(2025, 0, 1, 18, 0) },
    { day: '木曜日', enabled: true, startTime: new Date(2025, 0, 1, 9, 0), endTime: new Date(2025, 0, 1, 18, 0) },
    { day: '金曜日', enabled: true, startTime: new Date(2025, 0, 1, 9, 0), endTime: new Date(2025, 0, 1, 18, 0) },
    { day: '土曜日', enabled: false, startTime: new Date(2025, 0, 1, 10, 0), endTime: new Date(2025, 0, 1, 15, 0) },
    { day: '日曜日', enabled: false, startTime: new Date(2025, 0, 1, 10, 0), endTime: new Date(2025, 0, 1, 15, 0) },
  ]);

  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: '1', date: new Date(2025, 0, 1), name: '元日', isRecurring: true },
    { id: '2', date: new Date(2025, 11, 31), name: '年末休業', isRecurring: false },
  ]);

  const [openHolidayDialog, setOpenHolidayDialog] = useState(false);
  const [reservationInterval, setReservationInterval] = useState(30);
  const [breakTime, setBreakTime] = useState({
    enabled: true,
    startTime: new Date(2025, 0, 1, 12, 0),
    endTime: new Date(2025, 0, 1, 13, 0),
  });

  const handleScheduleToggle = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: Date | null) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const handleSave = () => {
    console.log('Saving availability settings:', { schedule, holidays, reservationInterval, breakTime });
    alert('設定を保存しました');
  };

  return (
    <TenantLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              休日・受付時間設定
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
            >
              設定を保存
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            予約を受け付ける曜日と時間帯を設定できます。設定した内容は、Googleカレンダーと同期され、自動的に予約可能時間が調整されます。
          </Alert>

          <Grid container spacing={3}>
            {/* 週間スケジュール */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <WbSunny sx={{ mr: 1 }} />
                    週間スケジュール
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <List>
                    {schedule.map((day, index) => (
                      <Box key={day.day}>
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={day.enabled}
                                    onChange={() => handleScheduleToggle(index)}
                                    color="primary"
                                  />
                                }
                                label={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                                    {day.day}
                                  </Typography>
                                }
                              />
                              {!day.enabled && (
                                <Chip label="休業日" size="small" sx={{ ml: 2 }} />
                              )}
                            </Box>
                            
                            {day.enabled && (
                              <Box sx={{ display: 'flex', gap: 2, ml: 6, alignItems: 'center' }}>
                                <TimePicker
                                  label="開始時刻"
                                  value={day.startTime}
                                  onChange={(newValue) => handleTimeChange(index, 'startTime', newValue)}
                                  slotProps={{ textField: { size: 'small' } }}
                                />
                                <Typography>〜</Typography>
                                <TimePicker
                                  label="終了時刻"
                                  value={day.endTime}
                                  onChange={(newValue) => handleTimeChange(index, 'endTime', newValue)}
                                  slotProps={{ textField: { size: 'small' } }}
                                />
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                        {index < schedule.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* 休憩時間設定 */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NightsStay sx={{ mr: 1 }} />
                    休憩時間
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={breakTime.enabled}
                        onChange={(e) => setBreakTime({ ...breakTime, enabled: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="休憩時間を設定する"
                    sx={{ mb: 2 }}
                  />
                  
                  {breakTime.enabled && (
                    <Box sx={{ display: 'flex', gap: 2, ml: 4, alignItems: 'center' }}>
                      <TimePicker
                        label="開始時刻"
                        value={breakTime.startTime}
                        onChange={(newValue) => setBreakTime({ ...breakTime, startTime: newValue || breakTime.startTime })}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                      <Typography>〜</Typography>
                      <TimePicker
                        label="終了時刻"
                        value={breakTime.endTime}
                        onChange={(newValue) => setBreakTime({ ...breakTime, endTime: newValue || breakTime.endTime })}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 予約設定 */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    予約設定
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>予約間隔</InputLabel>
                    <Select
                      value={reservationInterval}
                      onChange={(e) => setReservationInterval(Number(e.target.value))}
                      label="予約間隔"
                    >
                      <MenuItem value={15}>15分</MenuItem>
                      <MenuItem value={30}>30分</MenuItem>
                      <MenuItem value={60}>60分</MenuItem>
                      <MenuItem value={90}>90分</MenuItem>
                      <MenuItem value={120}>120分</MenuItem>
                    </Select>
                  </FormControl>

                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2" color="text.secondary">
                      予約の時間単位を設定します。
                      例：30分の場合、9:00, 9:30, 10:00... という形で予約枠が作成されます。
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>

              {/* 休日設定 */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Event sx={{ mr: 1 }} />
                      休日
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setOpenHolidayDialog(true)}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List dense>
                    {holidays.map((holiday) => (
                      <ListItem
                        key={holiday.id}
                        sx={{ px: 0 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={holiday.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {holiday.date.toLocaleDateString('ja-JP')}
                              </Typography>
                              {holiday.isRecurring && (
                                <Chip label="毎年" size="small" sx={{ mt: 0.5, height: 20 }} />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  {holidays.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                      休日が設定されていません
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 休日追加ダイアログ */}
          <Dialog open={openHolidayDialog} onClose={() => setOpenHolidayDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>休日を追加</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="休日名"
                  fullWidth
                  placeholder="例：夏季休業、臨時休業"
                />
                <DatePicker
                  label="日付"
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <FormControlLabel
                  control={<Switch />}
                  label="毎年繰り返す"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenHolidayDialog(false)}>キャンセル</Button>
              <Button variant="contained" onClick={() => setOpenHolidayDialog(false)}>
                追加
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LocalizationProvider>
    </TenantLayout>
  );
};

export default Availability;

