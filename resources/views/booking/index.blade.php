<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>予約フォーム</title>
    <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <style>
        /* リセット */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* ヘッダー */
        .header {
            background: #06C755;
            color: white;
            padding: 24px 20px;
            text-align: center;
        }

        .header h1 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.5;
        }

        /* コンテナ */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 0 40px;
        }

        /* エラーメッセージ */
        .alert {
            margin: 16px 20px;
            padding: 16px;
            border-radius: 12px;
            font-size: 15px;
            line-height: 1.5;
        }

        .alert-error {
            background: #fee;
            color: #c33;
            border: 1px solid #fcc;
        }

        .alert-info {
            background: #e3f2fd;
            color: #1976d2;
            border: 1px solid #90caf9;
        }

        .hidden {
            display: none !important;
        }

        /* セクションタイトル */
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            padding: 24px 20px 16px;
        }

        /* カレンダーナビゲーション */
        .calendar-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: white;
            margin: 0 0 1px;
        }

        .calendar-nav button {
            background: #06C755;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            min-width: 90px;
            transition: all 0.2s;
        }

        .calendar-nav button:active {
            background: #05B04A;
            transform: scale(0.98);
        }

        .calendar-nav span {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }

        /* 日付カード（モバイル最適化） */
        .date-cards {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding: 16px 20px;
            gap: 12px;
            background: white;
            margin-bottom: 1px;
        }

        .date-cards::-webkit-scrollbar {
            display: none;
        }

        .date-card {
            flex: 0 0 80px;
            scroll-snap-align: start;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 12px 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .date-card.selected {
            background: #06C755;
            border-color: #06C755;
            color: white;
        }

        .date-card.disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .date-card .day-name {
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
            opacity: 0.8;
        }

        .date-card.selected .day-name {
            opacity: 1;
        }

        .date-card .date-number {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
        }

        .date-card .month {
            font-size: 11px;
            margin-top: 4px;
            opacity: 0.7;
        }

        .date-card.selected .month {
            opacity: 0.9;
        }

        .date-card.today {
            border-color: #06C755;
            color: #06C755;
        }

        .date-card.today .day-name,
        .date-card.today .date-number,
        .date-card.today .month {
            color: #06C755;
        }

        .date-card.selected.today .day-name,
        .date-card.selected.today .date-number,
        .date-card.selected.today .month {
            color: white;
        }

        .date-card.sunday .day-name {
            color: #f44336;
        }

        .date-card.saturday .day-name {
            color: #2196f3;
        }

        .date-card.selected.sunday .day-name,
        .date-card.selected.saturday .day-name {
            color: white;
        }

        /* タイムスロット */
        .time-slots {
            padding: 0 20px 20px;
            background: white;
        }

        .time-slot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 20px;
            margin-bottom: 12px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;
        }

        .time-slot:active {
            transform: scale(0.98);
        }

        .time-slot.available {
            border-color: #4caf50;
        }

        .time-slot.available:hover {
            background: #f1f8f4;
            border-color: #4caf50;
        }

        .time-slot.unavailable {
            background: #fafafa;
            border-color: #e0e0e0;
            color: #999;
            cursor: not-allowed;
        }

        .time-slot.selected {
            background: #06C755;
            border-color: #06C755;
            color: white;
        }

        .time-slot-time {
            font-weight: 600;
            font-size: 17px;
        }

        .time-slot-status {
            font-size: 28px;
            line-height: 1;
        }

        .time-slot.available .time-slot-status {
            color: #4caf50;
        }

        .time-slot.selected .time-slot-status {
            color: white;
        }

        /* ローディング */
        .loading {
            text-align: center;
            padding: 60px 20px;
            background: white;
        }

        .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 16px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #06C755;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading p {
            color: #666;
            font-size: 15px;
        }

        /* フォームセクション */
        .form-section {
            background: white;
            margin-top: 1px;
            padding: 24px 20px 32px;
        }

        .selection-summary {
            background: #06C755;
            color: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .summary-row:last-child {
            border-bottom: none;
        }

        .summary-label {
            font-size: 14px;
            opacity: 0.9;
        }

        .summary-value {
            font-size: 16px;
            font-weight: 600;
        }

        /* フォームグループ */
        .form-group {
            margin-bottom: 24px;
        }

        .form-label {
            display: block;
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        .required {
            color: #f44336;
            margin-left: 4px;
        }

        .form-control {
            width: 100%;
            padding: 14px 16px;
            font-size: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            transition: all 0.2s;
            background: white;
        }

        .form-control:focus {
            outline: none;
            border-color: #06C755;
            box-shadow: 0 0 0 3px rgba(6, 199, 85, 0.1);
        }

        textarea.form-control {
            min-height: 100px;
            resize: vertical;
            font-family: inherit;
        }

        /* ボタングループ */
        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 32px;
        }

        .btn {
            flex: 1;
            padding: 16px 24px;
            font-size: 17px;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            min-height: 54px;
        }

        .btn:active {
            transform: scale(0.98);
        }

        .btn-primary {
            background: #06C755;
            color: white;
            box-shadow: 0 4px 12px rgba(6, 199, 85, 0.3);
        }

        .btn-primary:active {
            box-shadow: 0 2px 8px rgba(6, 199, 85, 0.3);
        }

        .btn-secondary {
            background: white;
            color: #06C755;
            border: 2px solid #06C755;
        }

        .btn-secondary:active {
            background: #f5f5f5;
        }

        /* 完了画面 */
        .success-container {
            text-align: center;
            padding: 40px 20px;
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background: #06C755;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            margin: 0 auto 24px;
            box-shadow: 0 8px 24px rgba(6, 199, 85, 0.3);
        }

        .success-container h2 {
            font-size: 22px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
        }

        .success-container p {
            font-size: 15px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        /* 空の状態 */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state-text {
            font-size: 16px;
            line-height: 1.6;
        }

        /* スクロールヒント */
        .scroll-hint {
            text-align: center;
            padding: 8px 20px;
            font-size: 13px;
            color: #999;
            background: white;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1 id="calendarName">読み込み中...</h1>
        <p id="calendarDescription"></p>
    </div>

    <div class="container">
        <!-- Error Message -->
        <div id="errorMessage" class="alert alert-error hidden"></div>

        <!-- Step 1: Date and Time Selection -->
        <div id="step1">
            <div class="section-title">日時を選択</div>
            
            <!-- Calendar Navigation -->
            <div class="calendar-nav">
                <button id="prevWeek">‹ 前へ</button>
                <span id="currentPeriod"></span>
                <button id="nextWeek">次へ ›</button>
            </div>

            <!-- Date Cards (Horizontal Scroll) -->
            <div class="date-cards" id="dateCards">
                <!-- Dynamically generated -->
            </div>
            <div class="scroll-hint">← スワイプで日付を選択 →</div>

            <!-- Time Slots -->
            <div id="timeSlotsContainer" class="hidden">
                <div class="time-slots" id="timeSlots">
                    <!-- Dynamically generated -->
                </div>
            </div>

            <div id="loadingCalendar" class="loading hidden">
                <div class="spinner"></div>
                <p>空き状況を読み込み中...</p>
            </div>

            <div id="emptySlots" class="empty-state hidden">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-text">
                    選択した日に<br>予約可能な時間がありません
                </div>
            </div>
        </div>

        <!-- Step 2: Information Input -->
        <div id="step2" class="form-section hidden">
            <div class="section-title">予約情報を入力</div>
            
            <div class="selection-summary">
                <div class="summary-row">
                    <span class="summary-label">予約日時</span>
                    <span class="summary-value" id="summaryDateTime"></span>
                </div>
            </div>

            <div id="hearingFormFields"></div>

            <div class="button-group">
                <button type="button" class="btn btn-secondary" id="backToCalendar">戻る</button>
                <button type="button" class="btn btn-primary" id="confirmButton">確認画面へ</button>
            </div>
        </div>

        <!-- Step 3: Confirmation -->
        <div id="step3" class="form-section hidden">
            <div class="section-title">予約内容の確認</div>
            
            <div class="alert alert-info">
                以下の内容でよろしいですか?
            </div>
            
            <div id="confirmationSummary"></div>

            <div class="button-group">
                <button type="button" class="btn btn-secondary" id="backToForm">戻る</button>
                <button type="button" class="btn btn-primary" id="submitButton">予約を確定する</button>
            </div>
        </div>

        <!-- Completion Screen -->
        <div id="stepComplete" class="form-section hidden">
            <div class="success-container">
                <div class="success-icon">✓</div>
                <h2>予約が完了しました！</h2>
                <p>
                    ご登録いただいたメールアドレスに<br>
                    確認メールをお送りしました。
                </p>
                <div class="selection-summary">
                    <div id="completeSummary"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Constants
        const calendarId = {{ $calendarId }};
        const apiBasePath = '/api/liff/{{ $tenantId }}';
        const liffId = '{{ $lineSetting->liff_id ?? "" }}';
        const tenantId = '{{ $tenantId }}';

        // State management
        let calendarData = null;
        let currentStartDate = new Date();
        let selectedDate = null;
        let selectedSlot = null;
        let weekSlots = {};
        let hasHearingForm = false;
        let lineUser = null;

        // Initialization
        document.addEventListener('DOMContentLoaded', function() {
            currentStartDate.setHours(0, 0, 0, 0);
            initializeLiff();
        });

        // LIFF初期化
        async function initializeLiff() {
            try {
                // liffIdが設定されているかチェック
                if (!liffId || liffId.trim() === '') {
                    console.error('LIFF ID is not configured');
                    showError('LINE設定が不完全です。管理者にお問い合わせください。');
                    return;
                }
                
                console.log('Initializing LIFF with ID:', liffId);
                await liff.init({ liffId: liffId });
                
                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }
                
                await loadUserProfile();
                loadCalendarData();
                setupEventListeners();
                
            } catch (error) {
                console.error('LIFF initialization failed:', error);
                showError('LINEログインに失敗しました。');
            }
        }

        // ユーザープロフィール取得
        async function loadUserProfile() {
            try {
                const profile = await liff.getProfile();
                
                // LINEユーザー情報をサーバーに送信
                const response = await fetch(`/api/liff/${tenantId}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        line_user_id: profile.userId,
                        display_name: profile.displayName,
                        picture_url: profile.pictureUrl,
                        status_message: profile.statusMessage
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    lineUser = data.data;
                } else {
                    throw new Error('Failed to login');
                }
                
            } catch (error) {
                console.error('Failed to load user profile:', error);
                showError('ユーザー情報の取得に失敗しました。');
            }
        }

        // Load calendar data
        async function loadCalendarData() {
            try {
                const response = await fetch(`${apiBasePath}/calendars/${calendarId}`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'カレンダー情報の取得に失敗しました');
                }
                
                calendarData = data.data;
                hasHearingForm = calendarData.hearing_form_id && calendarData.hearing_form;
                
                displayCalendarInfo();
                await loadWeekSlots();
            } catch (error) {
                showError(error.message);
            }
        }

        // Display calendar info
        function displayCalendarInfo() {
            document.getElementById('calendarName').textContent = calendarData.name;
            document.getElementById('calendarDescription').textContent = calendarData.description || '';
        }

        // Setup event listeners
        function setupEventListeners() {
            document.getElementById('prevWeek').addEventListener('click', () => {
                currentStartDate.setDate(currentStartDate.getDate() - 7);
                loadWeekSlots();
            });

            document.getElementById('nextWeek').addEventListener('click', () => {
                currentStartDate.setDate(currentStartDate.getDate() + 7);
                loadWeekSlots();
            });

            document.getElementById('backToCalendar').addEventListener('click', () => {
                document.getElementById('step1').classList.remove('hidden');
                document.getElementById('step2').classList.add('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.getElementById('confirmButton').addEventListener('click', () => {
                if (validateForm()) {
                    showConfirmation();
                    document.getElementById('step2').classList.add('hidden');
                    document.getElementById('step3').classList.remove('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });

            document.getElementById('backToForm').addEventListener('click', () => {
                document.getElementById('step3').classList.add('hidden');
                document.getElementById('step2').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.getElementById('submitButton').addEventListener('click', submitReservation);
        }

        // Load available slots for the week
        async function loadWeekSlots() {
            try {
                document.getElementById('loadingCalendar').classList.remove('hidden');
                document.getElementById('timeSlotsContainer').classList.add('hidden');
                document.getElementById('emptySlots').classList.add('hidden');
                
                weekSlots = {};
                const promises = [];
                
                for (let i = 0; i < 7; i++) {
                    const date = new Date(currentStartDate);
                    date.setDate(date.getDate() + i);
                    // 日本時間で日付を生成
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    console.log(`Loading slots for date: ${dateStr} (day ${i})`);
                    
                    promises.push(
                        fetch(`${apiBasePath}/calendars/${calendarId}/available-slots?date=${dateStr}`)
                            .then(res => res.json())
                            .then(data => {
                                console.log(`Received slots for ${dateStr}:`, data.data?.length || 0, 'slots');
                                weekSlots[dateStr] = data.data || [];
                            })
                            .catch(err => {
                                console.error(`Error loading slots for ${dateStr}:`, err);
                                weekSlots[dateStr] = [];
                            })
                    );
                }
                
                await Promise.all(promises);
                
                renderDateCards();
                document.getElementById('loadingCalendar').classList.add('hidden');
                
                // 最初の利用可能な日を自動選択
                autoSelectFirstAvailableDate();
            } catch (error) {
                showError('空き時間の取得に失敗しました');
                document.getElementById('loadingCalendar').classList.add('hidden');
            }
        }

        // Render date cards
        function renderDateCards() {
            const container = document.getElementById('dateCards');
            container.innerHTML = '';
            
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentStartDate);
                date.setDate(date.getDate() + i);
                // 日本時間で日付を生成
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const dayOfWeek = date.getDay();
                const isToday = date.getTime() === today.getTime();
                const hasSlots = weekSlots[dateStr] && weekSlots[dateStr].length > 0;
                
                const card = document.createElement('div');
                card.className = 'date-card';
                
                if (isToday) card.classList.add('today');
                if (dayOfWeek === 0) card.classList.add('sunday');
                if (dayOfWeek === 6) card.classList.add('saturday');
                if (!hasSlots) card.classList.add('disabled');
                
                card.innerHTML = `
                    <div class="day-name">${dayNames[dayOfWeek]}</div>
                    <div class="date-number">${date.getDate()}</div>
                    <div class="month">${date.getMonth() + 1}月</div>
                `;
                
                if (hasSlots) {
                    card.addEventListener('click', () => selectDate(dateStr));
                }
                
                container.appendChild(card);
            }
            
            // Update period display
            const endDate = new Date(currentStartDate);
            endDate.setDate(endDate.getDate() + 6);
            document.getElementById('currentPeriod').textContent = 
                `${currentStartDate.getMonth() + 1}/${currentStartDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
        }

        // Auto-select first available date
        function autoSelectFirstAvailableDate() {
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentStartDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                
                if (weekSlots[dateStr] && weekSlots[dateStr].length > 0) {
                    selectDate(dateStr);
                    return;
                }
            }
        }

        // Select a date
        function selectDate(dateStr) {
            selectedDate = dateStr;
            selectedSlot = null;
            
            // Update UI
            const cards = document.querySelectorAll('.date-card');
            cards.forEach((card, index) => {
                const date = new Date(currentStartDate);
                date.setDate(date.getDate() + index);
                // 日本時間で日付を生成
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const cardDateStr = `${year}-${month}-${day}`;
                
                if (cardDateStr === dateStr) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
            
            renderTimeSlots();
        }

        // Render time slots
        function renderTimeSlots() {
            const container = document.getElementById('timeSlots');
            const slots = weekSlots[selectedDate] || [];
            
            container.innerHTML = '';
            
            if (slots.length === 0) {
                document.getElementById('timeSlotsContainer').classList.add('hidden');
                document.getElementById('emptySlots').classList.remove('hidden');
                return;
            }
            
            document.getElementById('timeSlotsContainer').classList.remove('hidden');
            document.getElementById('emptySlots').classList.add('hidden');
            
            slots.forEach(slot => {
                const slotEl = document.createElement('div');
                slotEl.className = 'time-slot';
                
                if (slot.is_available) {
                    slotEl.classList.add('available');
                    slotEl.addEventListener('click', () => selectSlot(slot));
                } else {
                    slotEl.classList.add('unavailable');
                }
                
                slotEl.innerHTML = `
                    <span class="time-slot-time">${slot.start_time} - ${slot.end_time}</span>
                    <span class="time-slot-status">${slot.is_available ? '◯' : '×'}</span>
                `;
                
                container.appendChild(slotEl);
            });
        }

        // Select a time slot
        function selectSlot(slot) {
            selectedSlot = {
                date: selectedDate,
                ...slot
            };
            
            // Update UI
            const slots = document.querySelectorAll('.time-slot');
            slots.forEach(el => {
                el.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            
            // Move to information input section after a short delay
            setTimeout(() => {
                document.getElementById('step1').classList.add('hidden');
                document.getElementById('step2').classList.remove('hidden');
                
                // Update summary
                const dateObj = new Date(selectedDate);
                const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                document.getElementById('summaryDateTime').textContent = 
                    `${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayNames[dateObj.getDay()]}) ${slot.start_time}`;
                
                // Render hearing form if available
                if (hasHearingForm) {
                    renderHearingForm();
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 200);
        }

        // Render hearing form fields
        function renderHearingForm() {
            const container = document.getElementById('hearingFormFields');
            container.innerHTML = '';
            
            if (!hasHearingForm) return;
            
            calendarData.hearing_form.items.forEach((item) => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                
                const label = document.createElement('label');
                label.className = 'form-label';
                label.textContent = item.label;
                if (item.required) {
                    const required = document.createElement('span');
                    required.className = 'required';
                    required.textContent = '*';
                    label.appendChild(required);
                }
                formGroup.appendChild(label);
                
                let input;
                if (item.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.className = 'form-control';
                } else {
                    input = document.createElement('input');
                    input.type = item.type || 'text';
                    input.className = 'form-control';
                }
                
                input.id = `hearing_${item.id}`;
                input.placeholder = item.placeholder || '';
                if (item.required) {
                    input.required = true;
                }
                
                formGroup.appendChild(input);
                container.appendChild(formGroup);
            });
        }

        // Validate form fields
        function validateForm() {
            // ヒアリングフォームがある場合は必須項目をチェック
            if (hasHearingForm) {
                const items = calendarData.hearing_form.items;
                for (const item of items) {
                    if (item.required) {
                        const input = document.getElementById(`hearing_${item.id}`);
                        if (!input.value.trim()) {
                            showError(`${item.label}を入力してください`);
                            return false;
                        }
                    }
                }
            }
            // ヒアリングフォームがない場合はLINE名で予約（バリデーション不要）
            
            return true;
        }

        // Show confirmation screen
        function showConfirmation() {
            const dateObj = new Date(selectedSlot.date);
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            
            let html = `
                <div class="selection-summary">
                    <div class="summary-row">
                        <span class="summary-label">予約日時</span>
                        <span class="summary-value">${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayNames[dateObj.getDay()]}) ${selectedSlot.start_time}</span>
                    </div>
            `;
            
            // ヒアリングフォームがない場合はLINE名を表示
            if (!hasHearingForm) {
                html += `
                    <div class="summary-row">
                        <span class="summary-label">お名前</span>
                        <span class="summary-value">${lineUser?.display_name || 'LINEユーザー'}</span>
                    </div>
                `;
            }
            
            // Add hearing form answers
            if (hasHearingForm) {
                calendarData.hearing_form.items.forEach(item => {
                    const input = document.getElementById(`hearing_${item.id}`);
                    if (input && input.value) {
                        html += `
                            <div class="summary-row">
                                <span class="summary-label">${item.label}</span>
                                <span class="summary-value">${input.value}</span>
                            </div>
                        `;
                    }
                });
            }
            
            html += '</div>';
            document.getElementById('confirmationSummary').innerHTML = html;
        }

        // Submit reservation
        async function submitReservation() {
            try {
                const submitBtn = document.getElementById('submitButton');
                submitBtn.disabled = true;
                submitBtn.textContent = '予約中...';
                
                const requestData = {
                    reservation_datetime: selectedSlot.datetime,
                    customer_name: hasHearingForm ? 
                        (lineUser?.display_name || 'LINEユーザー') : 
                        (lineUser?.display_name || 'LINEユーザー'),
                    customer_email: null,
                    customer_phone: null,
                    line_user_id: lineUser?.line_user_id,
                };
                
                // 流入経路情報を追加
                const inflowSourceId = sessionStorage.getItem('inflow_source_id');
                if (inflowSourceId) {
                    requestData.inflow_source_id = inflowSourceId;
                }
                
                // Add hearing form answers
                if (hasHearingForm) {
                    const answers = [];
                    calendarData.hearing_form.items.forEach(item => {
                        const input = document.getElementById(`hearing_${item.id}`);
                        if (input && input.value) {
                            answers.push({
                                hearing_form_item_id: item.id,
                                answer_text: input.value,
                            });
                        }
                    });
                    if (answers.length > 0) {
                        requestData.answers = answers;
                    }
                }
                
                const response = await fetch(`/api/liff/${tenantId}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify(requestData),
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || '予約の作成に失敗しました');
                }
                
                showComplete();
            } catch (error) {
                showError(error.message);
                const submitBtn = document.getElementById('submitButton');
                submitBtn.disabled = false;
                submitBtn.textContent = '予約を確定する';
            }
        }

        // Show completion screen
        function showComplete() {
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.add('hidden');
            document.getElementById('step3').classList.add('hidden');
            document.getElementById('stepComplete').classList.remove('hidden');
            
            const dateObj = new Date(selectedSlot.date);
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            const summary = document.getElementById('completeSummary');
            summary.innerHTML = `
                <div class="summary-row">
                    <span class="summary-label">予約日時</span>
                    <span class="summary-value">${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayNames[dateObj.getDay()]}) ${selectedSlot.start_time}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">お名前</span>
                    <span class="summary-value">${document.getElementById('customerName').value}</span>
                </div>
            `;
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Show error message
        function showError(message) {
            const errorEl = document.getElementById('errorMessage');
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 5000);
        }
    </script>
</body>
</html>
