import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Grid,
  Chip,
  Alert,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Switch,
  InputAdornment,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Info,
  Schedule,
  People,
  Notifications,
  Settings as SettingsIcon,
  CheckCircle,
  Delete,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

const steps = [
  '基本情報',
  '受付設定',
  '連携設定',
  '通知設定',
  '確認',
];

interface CalendarFormData {
  name: string;
  type: 'any' | 'all';
  acceptDays: string[];
  startTime: string;
  endTime: string;
  displayInterval: number;
  eventDuration: number;
  daysInAdvance: number;
  minHoursBeforeBooking: number;
  connectedUserIds: number[];
  inviteCalendars: string[];
  slackNotify: boolean;
  slackWebhook: string;
  slackMessage: string;
  lineAutoReply: boolean;
  includeMeetUrl: boolean;
  lineReplyMessage: string;
  lineRemind: boolean;
  remindDaysBefore: number;
  remindHoursBefore: number;
  lineRemindMessage: string;
  hearingFormId: number | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  google_calendar_connected: boolean;
}

interface HearingForm {
  id: number;
  name: string;
  description: string;
}

const CalendarNew: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CalendarFormData>({
    name: '',
    type: 'any',
    acceptDays: [],
    startTime: '10:00',
    endTime: '19:00',
    displayInterval: 30,
    eventDuration: 60,
    daysInAdvance: 30,
    minHoursBeforeBooking: 2,
    connectedUserIds: [],
    inviteCalendars: [],
    slackNotify: false,
    slackWebhook: '',
    slackMessage: '新しい予約が入りました。\n予約者: {{customer_name}}\n日時: {{reservation_datetime}}',
    lineAutoReply: false,
    includeMeetUrl: true,
    lineReplyMessage: 'ご予約ありがとうございます。\n日時: {{reservation_datetime}}\n担当者: {{calendar_name}}',
    lineRemind: false,
    remindDaysBefore: 0,
    remindHoursBefore: 24,
    lineRemindMessage: '明日の予約のリマインドです。\n日時: {{reservation_datetime}}\n担当者: {{calendar_name}}',
    hearingFormId: null,
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [hearingForms, setHearingForms] = useState<HearingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // マスタデータを取得
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [usersResponse, formsResponse] = await Promise.all([
        axios.get('/api/calendar-users'),
        axios.get('/api/hearing-forms-list'),
      ]);
      setAvailableUsers(usersResponse.data.data);
      setHearingForms(formsResponse.data.data);
    } catch (error: any) {
      console.error('Failed to fetch master data:', error);
      setSnackbar({
        open: true,
        message: 'マスタデータの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const weekDays = ['月', '火', '水', '木', '金', '土', '日', '祝日'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'カレンダー名を入力してください',
        severity: 'error',
      });
      return;
    }

    if (formData.acceptDays.length === 0) {
      setSnackbar({
        open: true,
        message: '受付曜日を選択してください',
        severity: 'error',
      });
      return;
    }

    if (formData.connectedUserIds.length === 0) {
      setSnackbar({
        open: true,
        message: '連携ユーザーを選択してください',
        severity: 'error',
      });
      return;
    }

    try {
      setSaving(true);

      // フロントエンドのキャメルケースをバックエンドのスネークケースに変換
      const payload = {
        name: formData.name,
        type: formData.type,
        accept_days: formData.acceptDays,
        start_time: formData.startTime,
        end_time: formData.endTime,
        display_interval: formData.displayInterval,
        event_duration: formData.eventDuration,
        days_in_advance: formData.daysInAdvance,
        min_hours_before_booking: formData.minHoursBeforeBooking,
        user_ids: formData.connectedUserIds,
        invite_calendars: formData.inviteCalendars,
        hearing_form_id: formData.hearingFormId,
        slack_notify: formData.slackNotify,
        slack_webhook: formData.slackWebhook,
        slack_message: formData.slackMessage,
        line_auto_reply: formData.lineAutoReply,
        include_meet_url: formData.includeMeetUrl,
        line_reply_message: formData.lineReplyMessage,
        line_remind: formData.lineRemind,
        remind_days_before: formData.remindDaysBefore,
        remind_hours_before: formData.remindHoursBefore,
        line_remind_message: formData.lineRemindMessage,
      };

      const response = await axios.post('/api/calendars', payload);
      
      setSnackbar({
        open: true,
        message: 'カレンダーを作成しました',
        severity: 'success',
      });

      // 少し遅延してからリダイレクト
      setTimeout(() => {
        navigate('/calendars');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create calendar:', error);
      
      let errorMessage = 'カレンダーの作成に失敗しました';
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors[0] as string;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      acceptDays: formData.acceptDays.includes(day)
        ? formData.acceptDays.filter((d) => d !== day)
        : [...formData.acceptDays, day],
    });
  };

  const addInviteCalendar = () => {
    const email = prompt('招待するカレンダーのメールアドレスを入力してください');
    if (email && email.trim()) {
      setFormData({
        ...formData,
        inviteCalendars: [...formData.inviteCalendars, email.trim()],
      });
    }
  };

  const removeInviteCalendar = (index: number) => {
    setFormData({
      ...formData,
      inviteCalendars: formData.inviteCalendars.filter((_, i) => i !== index),
    });
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        // 基本情報
        return (
          <Box>
            <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
              カレンダーの基本情報を設定します
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="カレンダー名"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 通常予約カレンダー"
                  helperText="お客様には表示されません"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">カレンダータイプ *</FormLabel>
                  <RadioGroup
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'any' | 'all' })}
                  >
                    <FormControlLabel
                      value="any"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">いずれか空いている</Typography>
                          <Typography variant="caption" color="text.secondary">
                            連携しているユーザーの誰か1人でも空いていれば予約可能
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">全員空いている</Typography>
                          <Typography variant="caption" color="text.secondary">
                            連携しているユーザー全員が空いている時のみ予約可能
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        // 受付設定
        return (
          <Box>
            <Alert severity="info" icon={<Schedule />} sx={{ mb: 3 }}>
              予約を受け付ける日時と時間枠を設定します
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  受付曜日 *
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {weekDays.map((day) => (
                    <Chip
                      key={day}
                      label={day}
                      onClick={() => toggleDay(day)}
                      color={formData.acceptDays.includes(day) ? 'primary' : 'default'}
                      variant={formData.acceptDays.includes(day) ? 'filled' : 'outlined'}
                      sx={{ minWidth: 50 }}
                    />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="受付開始時間"
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="受付終了時間"
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>表示間隔</InputLabel>
                  <Select
                    value={formData.displayInterval}
                    onChange={(e) => setFormData({ ...formData, displayInterval: Number(e.target.value) })}
                    label="表示間隔"
                  >
                    <MenuItem value={15}>15分</MenuItem>
                    <MenuItem value={30}>30分</MenuItem>
                    <MenuItem value={60}>60分</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  予約可能な時間枠の表示間隔
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>イベント作成時間</InputLabel>
                  <Select
                    value={formData.eventDuration}
                    onChange={(e) => setFormData({ ...formData, eventDuration: Number(e.target.value) })}
                    label="イベント作成時間"
                  >
                    <MenuItem value={30}>30分</MenuItem>
                    <MenuItem value={60}>60分</MenuItem>
                    <MenuItem value={90}>90分</MenuItem>
                    <MenuItem value={120}>120分</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  カレンダーに作成されるイベントの長さ
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                  予約受付期間の制限
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="何日先まで予約を受け付けるか"
                  type="number"
                  required
                  value={formData.daysInAdvance}
                  onChange={(e) => setFormData({ ...formData, daysInAdvance: Number(e.target.value) })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">日先</InputAdornment>,
                    inputProps: { min: 1, max: 365 }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  例：30日の場合、11/20には12/20まで予約可能
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="当日の何時間後から予約を受け付けるか"
                  type="number"
                  required
                  value={formData.minHoursBeforeBooking}
                  onChange={(e) => setFormData({ ...formData, minHoursBeforeBooking: Number(e.target.value) })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">時間後</InputAdornment>,
                    inputProps: { min: 0, max: 72 }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  例：2時間の場合、14:00時点では16:00以降の予約が可能
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        // 連携設定
        return (
          <Box>
            <Alert severity="info" icon={<People />} sx={{ mb: 3 }}>
              Googleカレンダーと連携するユーザーを設定します
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  連携ユーザー *
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ mb: 2 }}>
                  予約時に空き状況を確認するユーザーを選択してください
                </Typography>
                <Stack spacing={1}>
                  {availableUsers.map((user) => (
                    <Paper key={user.id} variant="outlined" sx={{ p: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.connectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  connectedUserIds: [...formData.connectedUserIds, user.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  connectedUserIds: formData.connectedUserIds.filter((id) => id !== user.id),
                                });
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      招待するカレンダー
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      イベント作成時に招待するカレンダーのメールアドレス
                    </Typography>
                  </Box>
                  <Button startIcon={<Add />} onClick={addInviteCalendar} size="small">
                    追加
                  </Button>
                </Box>
                {formData.inviteCalendars.length === 0 ? (
                  <Alert severity="info">招待するカレンダーがありません</Alert>
                ) : (
                  <List>
                    {formData.inviteCalendars.map((email, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => removeInviteCalendar(index)}>
                            <Delete />
                          </IconButton>
                        }
                      >
                        <ListItemText primary={email} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        // 通知設定
        return (
          <Box>
            <Alert severity="info" icon={<Notifications />} sx={{ mb: 3 }}>
              予約時の通知設定を行います
            </Alert>
            <Grid container spacing={3}>
              {/* Slack通知 */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.slackNotify}
                        onChange={(e) => setFormData({ ...formData, slackNotify: e.target.checked })}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Slack通知
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          予約が入った際にSlackに通知を送信
                        </Typography>
                      </Box>
                    }
                  />
                  {formData.slackNotify && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Webhook URL"
                        value={formData.slackWebhook}
                        onChange={(e) => setFormData({ ...formData, slackWebhook: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="通知文言"
                        multiline
                        rows={3}
                        value={formData.slackMessage}
                        onChange={(e) => setFormData({ ...formData, slackMessage: e.target.value })}
                        helperText="変数: {{customer_name}}, {{reservation_datetime}}, {{customer_email}}, {{customer_phone}}"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* LINE自動返信 */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.lineAutoReply}
                        onChange={(e) => setFormData({ ...formData, lineAutoReply: e.target.checked })}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          LINE自動返信
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          予約完了後にLINEで自動返信を送信
                        </Typography>
                      </Box>
                    }
                  />
                  {formData.lineAutoReply && (
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.includeMeetUrl}
                            onChange={(e) => setFormData({ ...formData, includeMeetUrl: e.target.checked })}
                          />
                        }
                        label="Google Meet URLを含める"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="返信文言"
                        multiline
                        rows={4}
                        value={formData.lineReplyMessage}
                        onChange={(e) => setFormData({ ...formData, lineReplyMessage: e.target.value })}
                        helperText="変数: {{customer_name}}, {{reservation_datetime}}, {{calendar_name}}, {{meet_url}}, {{duration_minutes}}, {{customer_email}}, {{customer_phone}}"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* LINEリマインド */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.lineRemind}
                        onChange={(e) => setFormData({ ...formData, lineRemind: e.target.checked })}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          LINEリマインド
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          予約日時の前にリマインドを送信
                        </Typography>
                      </Box>
                    }
                  />
                  {formData.lineRemind && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="日数"
                            type="number"
                            value={formData.remindDaysBefore}
                            onChange={(e) => setFormData({ ...formData, remindDaysBefore: Number(e.target.value) })}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">日前</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="時間"
                            type="number"
                            value={formData.remindHoursBefore}
                            onChange={(e) => setFormData({ ...formData, remindHoursBefore: Number(e.target.value) })}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">時間前</InputAdornment>,
                            }}
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        fullWidth
                        label="リマインド文言"
                        multiline
                        rows={3}
                        value={formData.lineRemindMessage}
                        onChange={(e) => setFormData({ ...formData, lineRemindMessage: e.target.value })}
                        helperText="変数: {{customer_name}}, {{reservation_datetime}}, {{calendar_name}}"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* ヒアリングフォーム */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ヒアリングフォーム
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ mb: 2 }}>
                    予約時にお客様に入力していただくフォームを選択
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>フォームを選択</InputLabel>
                    <Select
                      value={formData.hearingFormId ?? ''}
                      onChange={(e) => setFormData({ ...formData, hearingFormId: e.target.value ? Number(e.target.value) : null })}
                      label="フォームを選択"
                    >
                      <MenuItem value="">なし</MenuItem>
                      {hearingForms.map((form) => (
                        <MenuItem key={form.id} value={form.id}>
                          {form.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        // 確認
        return (
          <Box>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
              設定内容を確認してください
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    基本情報
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        カレンダー名
                      </Typography>
                      <Typography variant="body1">{formData.name}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        タイプ
                      </Typography>
                      <Typography variant="body1">
                        {formData.type === 'any' ? 'いずれか空き' : '全員空き'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    受付設定
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        受付曜日
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {formData.acceptDays.map((day) => (
                          <Chip key={day} label={day} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        受付時間
                      </Typography>
                      <Typography variant="body1">
                        {formData.startTime} - {formData.endTime}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">
                        表示間隔
                      </Typography>
                      <Typography variant="body1">{formData.displayInterval}分</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">
                        イベント時間
                      </Typography>
                      <Typography variant="body1">{formData.eventDuration}分</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        予約受付期間
                      </Typography>
                      <Typography variant="body1">{formData.daysInAdvance}日先まで</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        最小受付時間
                      </Typography>
                      <Typography variant="body1">{formData.minHoursBeforeBooking}時間後から</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    連携設定
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    連携ユーザー数: {formData.connectedUserIds.length}名
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    招待カレンダー数: {formData.inviteCalendars.length}件
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    通知設定
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Slack通知: {formData.slackNotify ? '有効' : '無効'}
                    </Typography>
                    <Typography variant="body2">
                      LINE自動返信: {formData.lineAutoReply ? '有効' : '無効'}
                    </Typography>
                    <Typography variant="body2">
                      LINEリマインド: {formData.lineRemind ? '有効' : '無効'}
                    </Typography>
                    <Typography variant="body2">
                      ヒアリングフォーム: {formData.hearingFormId || 'なし'}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/calendars')}
            sx={{ mb: 2 }}
            disabled={saving}
          >
            カレンダー一覧に戻る
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            新規カレンダー作成
          </Typography>
        </Box>

        {/* ステッパー */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ py: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* コンテンツ */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent(activeStep)}
          </CardContent>
        </Card>

        {/* ナビゲーションボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || saving}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            size="large"
          >
            戻る
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                size="large"
                disabled={saving}
              >
                {saving ? '作成中...' : '作成する'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                size="large"
                disabled={saving}
              >
                次へ
              </Button>
            )}
          </Box>
        </Box>

        {/* Snackbar通知 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </TenantLayout>
  );
};

export default CalendarNew;

