<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>アカウント招待 - {{ $tenantName }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@mui/material@5.15.0/umd/material-ui.production.min.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        #root {
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        const invitationData = {!! json_encode([
            'invitation' => $invitation,
            'tenantName' => $tenantName,
            'token' => $token,
        ]) !!};
        
        const { useState, useEffect } = React;
        const { 
            Box, Card, CardContent, Typography, Button, TextField, 
            Alert, Stack, CircularProgress, Snackbar, Paper, Divider 
        } = MaterialUI;
        
        // CSRFトークンの設定
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        
        function InviteAccept() {
            const [loading, setLoading] = useState(false);
            const [saving, setSaving] = useState(false);
            const [formData, setFormData] = useState({
                password: '',
                password_confirmation: '',
                terms_accepted: false,
            });
            const [snackbar, setSnackbar] = useState({
                open: false,
                message: '',
                severity: 'success'
            });

            const { invitation, tenantName, token } = invitationData;
            const expiresAt = new Date(invitation.expires_at);
            const roleText = invitation.role === 'admin' ? '管理者' : 'ユーザー';

            const handleAccept = async () => {
                if (!formData.password || !formData.password_confirmation) {
                    setSnackbar({
                        open: true,
                        message: 'パスワードを入力してください',
                        severity: 'error',
                    });
                    return;
                }

                if (formData.password !== formData.password_confirmation) {
                    setSnackbar({
                        open: true,
                        message: 'パスワードが一致しません',
                        severity: 'error',
                    });
                    return;
                }

                if (!formData.terms_accepted) {
                    setSnackbar({
                        open: true,
                        message: '利用規約に同意してください',
                        severity: 'error',
                    });
                    return;
                }

                setSaving(true);
                try {
                    const response = await axios.post('/invite/accept', {
                        token,
                        password: formData.password,
                        password_confirmation: formData.password_confirmation,
                        terms_accepted: formData.terms_accepted,
                    });

                    setSnackbar({
                        open: true,
                        message: 'アカウントが作成されました！',
                        severity: 'success',
                    });

                    // ダッシュボードにリダイレクト
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);

                } catch (error) {
                    console.error('Failed to accept invitation:', error);
                    const errorMessage = error.response?.data?.message || 'アカウントの作成に失敗しました';
                    setSnackbar({
                        open: true,
                        message: errorMessage,
                        severity: 'error',
                    });
                } finally {
                    setSaving(false);
                }
            };

            return React.createElement(Box, { 
                style: { 
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    paddingTop: 32,
                    paddingBottom: 32
                }
            }, [
                React.createElement(Box, { 
                    key: 'container',
                    style: { 
                        maxWidth: 600, 
                        margin: '0 auto', 
                        paddingLeft: 24, 
                        paddingRight: 24 
                    }
                }, [
                    React.createElement(Card, { key: 'card' }, [
                        React.createElement(CardContent, { key: 'content' }, [
                            React.createElement(Box, { 
                                key: 'header',
                                style: { textAlign: 'center', marginBottom: 32 }
                            }, [
                                React.createElement(Typography, { 
                                    key: 'title',
                                    variant: 'h4', 
                                    gutterBottom: true, 
                                    style: { fontWeight: 'bold' }
                                }, tenantName),
                                React.createElement(Typography, { 
                                    key: 'subtitle',
                                    variant: 'h6', 
                                    color: 'text.secondary'
                                }, 'アカウント招待')
                            ]),
                            
                            React.createElement(Paper, { 
                                key: 'info',
                                variant: 'outlined', 
                                style: { padding: 24, marginBottom: 32 }
                            }, [
                                React.createElement(Typography, { 
                                    key: 'info-title',
                                    variant: 'h6', 
                                    gutterBottom: true
                                }, '招待内容'),
                                React.createElement(Stack, { key: 'info-stack', spacing: 2 }, [
                                    React.createElement(Box, { key: 'name' }, [
                                        React.createElement(Typography, { 
                                            variant: 'body2', 
                                            color: 'text.secondary'
                                        }, 'お名前'),
                                        React.createElement(Typography, { 
                                            variant: 'body1', 
                                            sx: { fontWeight: 'bold' }
                                        }, invitation.name)
                                    ]),
                                    React.createElement(Box, { key: 'email' }, [
                                        React.createElement(Typography, { 
                                            variant: 'body2', 
                                            color: 'text.secondary'
                                        }, 'メールアドレス'),
                                        React.createElement(Typography, { 
                                            variant: 'body1'
                                        }, invitation.email)
                                    ]),
                                    React.createElement(Box, { key: 'role' }, [
                                        React.createElement(Typography, { 
                                            variant: 'body2', 
                                            color: 'text.secondary'
                                        }, '権限'),
                                        React.createElement(Typography, { 
                                            variant: 'body1'
                                        }, roleText)
                                    ]),
                                    React.createElement(Box, { key: 'inviter' }, [
                                        React.createElement(Typography, { 
                                            variant: 'body2', 
                                            color: 'text.secondary'
                                        }, '招待者'),
                                        React.createElement(Typography, { 
                                            variant: 'body1'
                                        }, invitation.inviter.name)
                                    ]),
                                    React.createElement(Box, { key: 'expires' }, [
                                        React.createElement(Typography, { 
                                            variant: 'body2', 
                                            color: 'text.secondary'
                                        }, '有効期限'),
                                        React.createElement(Typography, { 
                                            variant: 'body1'
                                        }, expiresAt.toLocaleDateString('ja-JP') + ' ' + expiresAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }))
                                    ])
                                ])
                            ]),
                            
                            React.createElement(Divider, { key: 'divider', style: { marginTop: 24, marginBottom: 24 } }),
                            
                            React.createElement(Typography, { 
                                key: 'form-title',
                                variant: 'h6', 
                                gutterBottom: true
                            }, 'アカウント作成'),
                            
                            React.createElement(Stack, { key: 'form', spacing: 3 }, [
                                React.createElement(TextField, {
                                    key: 'password',
                                    label: 'パスワード',
                                    type: 'password',
                                    fullWidth: true,
                                    required: true,
                                    value: formData.password,
                                    onChange: (e) => setFormData({ ...formData, password: e.target.value }),
                                    helperText: '8文字以上で入力してください'
                                }),
                                
                                React.createElement(TextField, {
                                    key: 'password-confirm',
                                    label: 'パスワード確認',
                                    type: 'password',
                                    fullWidth: true,
                                    required: true,
                                    value: formData.password_confirmation,
                                    onChange: (e) => setFormData({ ...formData, password_confirmation: e.target.value })
                                }),
                                
                                React.createElement(Box, { 
                                    key: 'terms',
                                    style: { display: 'flex', alignItems: 'center' }
                                }, [
                                    React.createElement('input', {
                                        key: 'checkbox',
                                        type: 'checkbox',
                                        id: 'terms_accepted',
                                        checked: formData.terms_accepted,
                                        onChange: (e) => setFormData({ ...formData, terms_accepted: e.target.checked }),
                                        style: { marginRight: 8 }
                                    }),
                                    React.createElement('label', { 
                                        key: 'label',
                                        htmlFor: 'terms_accepted'
                                    }, [
                                        React.createElement(Typography, { 
                                            key: 'label-text',
                                            variant: 'body2'
                                        }, '利用規約に同意する')
                                    ])
                                ]),
                                
                                React.createElement(Alert, { 
                                    key: 'info-alert',
                                    severity: 'info'
                                }, 'アカウント作成後、自動的にログインされ、ダッシュボードに移動します。'),
                                
                                React.createElement(Button, {
                                    key: 'submit',
                                    variant: 'contained',
                                    size: 'large',
                                    fullWidth: true,
                                    onClick: handleAccept,
                                    disabled: saving,
                                    style: { paddingTop: 12, paddingBottom: 12 }
                                }, saving ? '作成中...' : 'アカウントを作成')
                            ])
                        ])
                    ])
                ]),
                
                React.createElement(Snackbar, {
                    key: 'snackbar',
                    open: snackbar.open,
                    autoHideDuration: 6000,
                    onClose: () => setSnackbar({ ...snackbar, open: false }),
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                }, [
                    React.createElement(Alert, {
                        key: 'alert',
                        onClose: () => setSnackbar({ ...snackbar, open: false }),
                        severity: snackbar.severity,
                        style: { width: '100%' }
                    }, snackbar.message)
                ])
            ]);
        }

        ReactDOM.render(React.createElement(InviteAccept), document.getElementById('root'));
    </script>
</body>
</html>
