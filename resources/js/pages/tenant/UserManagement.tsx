import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  Badge,
  Stack,
  Button,
} from '@mui/material';
import {
  Search,
  Send,
  AttachFile,
  Image as ImageIcon,
  MoreVert,
  Person,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';

interface LineUser {
  id: string;
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
  addedAt: string;
  lastMessageAt: string;
  unreadCount: number;
  tags: string[];
  totalReservations: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<LineUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // モックユーザーデータ
  const [users] = useState<LineUser[]>([
    {
      id: '1',
      displayName: '山田太郎',
      pictureUrl: '',
      statusMessage: 'よろしくお願いします',
      addedAt: '2025-09-15',
      lastMessageAt: '2025-10-20 14:30',
      unreadCount: 2,
      tags: ['VIP', '常連'],
      totalReservations: 15,
    },
    {
      id: '2',
      displayName: '佐藤花子',
      pictureUrl: '',
      statusMessage: '',
      addedAt: '2025-10-01',
      lastMessageAt: '2025-10-20 10:15',
      unreadCount: 0,
      tags: ['新規'],
      totalReservations: 3,
    },
    {
      id: '3',
      displayName: '鈴木一郎',
      pictureUrl: '',
      statusMessage: 'いつもありがとうございます',
      addedAt: '2025-08-20',
      lastMessageAt: '2025-10-19 18:45',
      unreadCount: 1,
      tags: ['常連'],
      totalReservations: 22,
    },
    {
      id: '4',
      displayName: '田中美咲',
      pictureUrl: '',
      statusMessage: '',
      addedAt: '2025-10-18',
      lastMessageAt: '2025-10-18 16:20',
      unreadCount: 0,
      tags: ['新規'],
      totalReservations: 1,
    },
  ]);

  // モックメッセージデータ
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: '1',
      senderName: '山田太郎',
      content: 'こんにちは！明日の予約の件で質問があります。',
      timestamp: '2025-10-20 14:25',
      isFromUser: true,
    },
    {
      id: '2',
      senderId: 'admin',
      senderName: 'あなた',
      content: 'こんにちは！どのようなご質問でしょうか？',
      timestamp: '2025-10-20 14:27',
      isFromUser: false,
    },
    {
      id: '3',
      senderId: '1',
      senderName: '山田太郎',
      content: '時間を30分遅らせることは可能でしょうか？',
      timestamp: '2025-10-20 14:30',
      isFromUser: true,
    },
  ]);

  const handleUserSelect = (user: LineUser) => {
    setSelectedUser(user);
    // メッセージを既読にする（実際はAPI呼び出し）
    const updatedUser = { ...user, unreadCount: 0 };
    setSelectedUser(updatedUser);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUser) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'admin',
        senderName: 'あなた',
        content: messageInput,
        timestamp: new Date().toLocaleString('ja-JP'),
        isFromUser: false,
      };
      setMessages([...messages, newMessage]);
      setMessageInput('');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedUser
    ? messages.filter((msg) => msg.senderId === selectedUser.id || msg.senderId === 'admin')
    : [];

  return (
    <TenantLayout>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
          ユーザー管理
        </Typography>

        <Grid container spacing={3}>
          {/* ユーザー一覧 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 'calc(100vh - 200px)' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
                {/* 検索バー */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    placeholder="ユーザー名で検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip label={`全体 (${users.length})`} size="small" color="primary" />
                    <Chip
                      label={`未読 (${users.reduce((sum, u) => sum + u.unreadCount, 0)})`}
                      size="small"
                      color="error"
                    />
                  </Box>
                </Box>

                {/* ユーザーリスト */}
                <List sx={{ overflow: 'auto', flexGrow: 1 }}>
                  {filteredUsers.map((user) => (
                    <ListItemButton
                      key={user.id}
                      selected={selectedUser?.id === user.id}
                      onClick={() => handleUserSelect(user)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={user.unreadCount} color="error">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.displayName.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {user.displayName}
                            </Typography>
                            {user.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ height: 18, fontSize: 10 }}
                                color={tag === 'VIP' ? 'warning' : 'default'}
                              />
                            ))}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {user.statusMessage || '最終メッセージがありません'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {user.lastMessageAt}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* チャットエリア */}
          <Grid item xs={12} md={8}>
            {selectedUser ? (
              <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                {/* チャットヘッダー */}
                <CardContent sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {selectedUser.displayName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {selectedUser.displayName}
                          </Typography>
                          {selectedUser.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              color={tag === 'VIP' ? 'warning' : 'default'}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          友だち追加日: {selectedUser.addedAt} | 予約回数: {selectedUser.totalReservations}回
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </CardContent>

                {/* メッセージエリア */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                  <Stack spacing={2}>
                    {currentMessages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.isFromUser ? 'flex-start' : 'flex-end',
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: message.isFromUser ? 'row' : 'row-reverse',
                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: message.isFromUser ? 'primary.main' : 'secondary.main',
                            }}
                          >
                            {message.isFromUser ? (
                              selectedUser.displayName.charAt(0)
                            ) : (
                              <Person fontSize="small" />
                            )}
                          </Avatar>
                          <Box>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 1.5,
                                bgcolor: message.isFromUser ? 'white' : 'primary.main',
                                color: message.isFromUser ? 'text.primary' : 'white',
                              }}
                            >
                              <Typography variant="body2">{message.content}</Typography>
                            </Paper>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                textAlign: message.isFromUser ? 'left' : 'right',
                              }}
                            >
                              {message.timestamp}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* メッセージ入力エリア */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small">
                      <AttachFile />
                    </IconButton>
                    <IconButton size="small">
                      <ImageIcon />
                    </IconButton>
                    <TextField
                      fullWidth
                      placeholder="メッセージを入力..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      multiline
                      maxRows={3}
                      size="small"
                    />
                    <IconButton color="primary" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            ) : (
              <Card sx={{ height: 'calc(100vh - 200px)' }}>
                <CardContent
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Person sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      ユーザーを選択してください
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      左のリストからユーザーを選択すると、チャットが表示されます
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </TenantLayout>
  );
};

export default UserManagement;

