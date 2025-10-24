<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GoogleCalendarService
{
    private $client;
    private $user;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * ユーザーを設定
     */
    public function setUser($user)
    {
        $this->user = $user;
    }

    /**
     * イベントを取得
     */
    public function getEvents(string $calendarId, string $startDateTime, string $endDateTime)
    {
        try {
            if (!$this->user) {
                throw new \Exception('User not set');
            }

            $accessToken = $this->getAccessToken($this->user->google_refresh_token);
            
            $response = $this->client->get("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'query' => [
                    'timeMin' => $startDateTime,
                    'timeMax' => $endDateTime,
                    'singleEvents' => 'true',
                    'orderBy' => 'startTime',
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            return $data['items'] ?? [];
            
        } catch (\Exception $e) {
            Log::error('Failed to get Google Calendar events: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * 日付範囲でイベントを取得（バッチ処理用）
     */
    public function getEventsForDateRange(string $refreshToken, string $calendarId, Carbon $startDate, Carbon $endDate)
    {
        try {
            \Log::info('GoogleCalendarService: Getting events for date range', [
                'calendar_id' => $calendarId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]);

            // リフレッシュトークンでアクセストークンを取得
            $accessToken = $this->getAccessToken($refreshToken);
            
            $timeMin = $startDate->copy()->startOfDay()->toRfc3339String();
            $timeMax = $endDate->copy()->endOfDay()->toRfc3339String();
            
            \Log::info('GoogleCalendarService: Fetching events for date range', [
                'calendar_id' => $calendarId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'time_min' => $timeMin,
                'time_max' => $timeMax,
            ]);
            
            $response = $this->client->get("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'query' => [
                    'timeMin' => $timeMin,
                    'timeMax' => $timeMax,
                    'singleEvents' => 'true',
                    'orderBy' => 'startTime',
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            $events = $data['items'] ?? [];
            
            \Log::info('GoogleCalendarService: Date range API response received', [
                'calendar_id' => $calendarId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'events_count' => count($events),
                'events' => array_map(function($event) {
                    return [
                        'summary' => $event['summary'] ?? 'No title',
                        'start' => $event['start']['dateTime'] ?? $event['start']['date'] ?? 'No start time',
                        'end' => $event['end']['dateTime'] ?? $event['end']['date'] ?? 'No end time',
                    ];
                }, $events),
            ]);
            
            return $events;
            
        } catch (\Exception $e) {
            Log::error('Google Calendar API error (date range): ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return [];
        }
    }
    public function getAvailableSlots(string $refreshToken, string $calendarId, Carbon $date, array $timeSlots)
    {
        try {
            \Log::info('GoogleCalendarService: Getting available slots', [
                'calendar_id' => $calendarId,
                'date' => $date->format('Y-m-d'),
                'time_slots_count' => count($timeSlots),
            ]);

            // リフレッシュトークンでアクセストークンを取得
            $accessToken = $this->getAccessToken($refreshToken);
            
            // 指定日のイベントを取得
            $events = $this->getEventsForDate($accessToken, $calendarId, $date);
            
            \Log::info('GoogleCalendarService: Retrieved events', [
                'calendar_id' => $calendarId,
                'date' => $date->format('Y-m-d'),
                'events_count' => count($events),
                'events' => array_map(function($event) {
                    return [
                        'summary' => $event['summary'] ?? 'No title',
                        'start' => $event['start']['dateTime'] ?? $event['start']['date'] ?? 'No start time',
                        'end' => $event['end']['dateTime'] ?? $event['end']['date'] ?? 'No end time',
                    ];
                }, $events),
            ]);
            
            // 各時間枠の空き状況をチェック
            $availableSlots = [];
            
            foreach ($timeSlots as $slot) {
                $slotStart = Carbon::parse($slot['datetime']);
                $slotEnd = $slotStart->copy()->addMinutes($slot['duration_minutes'] ?? 60);
                
                $isAvailable = $this->isTimeSlotAvailable($events, $slotStart, $slotEnd);
                
                \Log::info('GoogleCalendarService: Checking slot availability', [
                    'slot_start' => $slotStart->format('Y-m-d H:i:s'),
                    'slot_end' => $slotEnd->format('Y-m-d H:i:s'),
                    'is_available' => $isAvailable,
                ]);
                
                $availableSlots[] = [
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'datetime' => $slot['datetime'],
                    'is_available' => $isAvailable,
                ];
            }
            
            \Log::info('GoogleCalendarService: Returning available slots', [
                'calendar_id' => $calendarId,
                'date' => $date->format('Y-m-d'),
                'available_slots' => $availableSlots,
            ]);
            
            return $availableSlots;
            
        } catch (\Exception $e) {
            Log::error('Google Calendar API error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // エラーの場合は全て利用不可として返す
            return array_map(function($slot) {
                return [
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'datetime' => $slot['datetime'],
                    'is_available' => false,
                ];
            }, $timeSlots);
        }
    }

    /**
     * Google Calendarにイベントを作成（公開予約ページ用）
     */
    public function createEventForPublic(string $refreshToken, string $calendarId, array $eventData)
    {
        try {
            $accessToken = $this->getAccessToken($refreshToken);
            
            $event = [
                'summary' => $eventData['summary'],
                'description' => $eventData['description'] ?? '',
                'start' => [
                    'dateTime' => $eventData['start_datetime'],
                    'timeZone' => 'Asia/Tokyo',
                ],
                'end' => [
                    'dateTime' => $eventData['end_datetime'],
                    'timeZone' => 'Asia/Tokyo',
                ],
            ];
            
            // 会議URLがある場合は追加
            if (isset($eventData['meet_url'])) {
                $event['conferenceData'] = [
                    'createRequest' => [
                        'requestId' => uniqid(),
                        'conferenceSolutionKey' => [
                            'type' => 'hangoutsMeet'
                        ]
                    ]
                ];
            }
            
            $response = $this->client->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'query' => [
                    'conferenceDataVersion' => 1,
                ],
                'json' => $event,
            ]);
            
            $eventData = json_decode($response->getBody(), true);
            
            return [
                'success' => true,
                'event_id' => $eventData['id'],
                'meet_url' => $eventData['conferenceData']['entryPoints'][0]['uri'] ?? null,
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to create Google Calendar event: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * リフレッシュトークンでアクセストークンを取得
     */
    private function getAccessToken(string $refreshToken)
    {
        $response = $this->client->post('https://oauth2.googleapis.com/token', [
            'form_params' => [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => decrypt($refreshToken),
                'grant_type' => 'refresh_token',
            ],
        ]);

        $data = json_decode($response->getBody(), true);
        return $data['access_token'];
    }

    /**
     * 指定日のイベントを取得
     */
    private function getEventsForDate(string $accessToken, string $calendarId, Carbon $date)
    {
        $timeMin = $date->copy()->startOfDay()->toRfc3339String();
        $timeMax = $date->copy()->endOfDay()->toRfc3339String();
        
        \Log::info('GoogleCalendarService: Fetching events for date', [
            'calendar_id' => $calendarId,
            'requested_date' => $date->format('Y-m-d'),
            'time_min' => $timeMin,
            'time_max' => $timeMax,
        ]);
        
        $response = $this->client->get("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
            'query' => [
                'timeMin' => $timeMin,
                'timeMax' => $timeMax,
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
            ],
        ]);

        $data = json_decode($response->getBody(), true);
        $events = $data['items'] ?? [];
        
        \Log::info('GoogleCalendarService: API response received', [
            'calendar_id' => $calendarId,
            'requested_date' => $date->format('Y-m-d'),
            'events_count' => count($events),
            'events' => array_map(function($event) {
                return [
                    'summary' => $event['summary'] ?? 'No title',
                    'start' => $event['start']['dateTime'] ?? $event['start']['date'] ?? 'No start time',
                    'end' => $event['end']['dateTime'] ?? $event['end']['date'] ?? 'No end time',
                ];
            }, $events),
        ]);
        
        return $events;
    }

    /**
     * 時間枠が利用可能かチェック
     */
    private function isTimeSlotAvailable(array $events, Carbon $slotStart, Carbon $slotEnd)
    {
        foreach ($events as $event) {
            $eventStart = Carbon::parse($event['start']['dateTime'] ?? $event['start']['date']);
            $eventEnd = Carbon::parse($event['end']['dateTime'] ?? $event['end']['date']);
            
            \Log::info('Time overlap check', [
                'slot_start' => $slotStart->format('Y-m-d H:i:s'),
                'slot_end' => $slotEnd->format('Y-m-d H:i:s'),
                'event_start' => $eventStart->format('Y-m-d H:i:s'),
                'event_end' => $eventEnd->format('Y-m-d H:i:s'),
                'event_summary' => $event['summary'] ?? 'No title',
                'overlap_check' => [
                    'slot_start_lt_event_end' => $slotStart->lt($eventEnd),
                    'slot_end_gt_event_start' => $slotEnd->gt($eventStart),
                    'has_overlap' => $slotStart->lt($eventEnd) && $slotEnd->gt($eventStart),
                ],
            ]);
            
            // 時間が重複しているかチェック
            if ($slotStart->lt($eventEnd) && $slotEnd->gt($eventStart)) {
                \Log::info('Time slot conflict detected', [
                    'slot_start' => $slotStart->format('Y-m-d H:i:s'),
                    'slot_end' => $slotEnd->format('Y-m-d H:i:s'),
                    'conflicting_event' => $event['summary'] ?? 'No title',
                    'event_start' => $eventStart->format('Y-m-d H:i:s'),
                    'event_end' => $eventEnd->format('Y-m-d H:i:s'),
                ]);
                return false;
            }
        }
        
        \Log::info('Time slot is available', [
            'slot_start' => $slotStart->format('Y-m-d H:i:s'),
            'slot_end' => $slotEnd->format('Y-m-d H:i:s'),
        ]);
        
        return true;
    }

    /**
     * Googleカレンダーにイベントを作成（管理者用予約管理）
     */
    public function createEventForAdmin(string $refreshToken, string $calendarId, array $eventData)
    {
        try {
            $accessToken = $this->getAccessToken($refreshToken);
            
            $response = $this->client->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'query' => [
                    'conferenceDataVersion' => 1,
                ],
                'json' => $eventData,
            ]);

            $responseData = json_decode($response->getBody(), true);
            
            return $responseData;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * invite_calendarsの招待機能付きでイベントを作成
     */
    public function createEventWithInvites(string $refreshToken, string $calendarId, array $eventData, array $inviteCalendars = [])
    {
        try {
            \Log::info('GoogleCalendarService: createEventWithInvites called', [
                'calendar_id' => $calendarId,
                'invite_calendars' => $inviteCalendars,
                'event_data' => $eventData,
            ]);
            
            $accessToken = $this->getAccessToken($refreshToken);
            
            // 招待するカレンダーをattendeesに追加
            if (!empty($inviteCalendars)) {
                $eventData['attendees'] = [];
                foreach ($inviteCalendars as $calendarId) {
                    // Google Calendar IDをattendeesに追加
                    // カレンダーIDは通常、メールアドレス形式またはカレンダーID形式
                    $eventData['attendees'][] = [
                        'email' => $calendarId, // Google Calendar IDをemailフィールドに設定
                        'responseStatus' => 'needsAction',
                    ];
                }
            }
            
            \Log::info('GoogleCalendarService: Final event data with attendees', [
                'event_data' => $eventData,
                'attendees_count' => count($eventData['attendees'] ?? []),
            ]);
            
            $response = $this->client->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'query' => [
                    'conferenceDataVersion' => 1,
                    'sendUpdates' => 'all', // 招待者に通知を送信
                ],
                'json' => $eventData,
            ]);

            $responseData = json_decode($response->getBody(), true);
            
            \Log::info('GoogleCalendarService: Event creation response', [
                'status_code' => $response->getStatusCode(),
                'response_data' => $responseData,
            ]);
            
            return $responseData;
            
        } catch (\Exception $e) {
            \Log::error('GoogleCalendarService: createEventWithInvites failed', [
                'error' => $e->getMessage(),
                'calendar_id' => $calendarId,
                'invite_calendars' => $inviteCalendars,
            ]);
            return null;
        }
    }

    /**
     * Googleカレンダーのイベントを更新
     */
    public function updateEvent(string $refreshToken, string $calendarId, string $eventId, array $eventData)
    {
        try {
            \Log::info('GoogleCalendarService: Updating event', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'event_data' => $eventData,
            ]);

            // リフレッシュトークンでアクセストークンを取得
            $accessToken = $this->getAccessToken($refreshToken);
            
            $response = $this->client->put("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$eventId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => $eventData,
            ]);

            $responseData = json_decode($response->getBody(), true);
            
            \Log::info('GoogleCalendarService: Event updated successfully', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
            ]);
            
            return $responseData;
            
        } catch (\Exception $e) {
            \Log::error('GoogleCalendarService: Failed to update event', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Googleカレンダーのイベントを削除
     */
    public function deleteEvent(string $refreshToken, string $calendarId, string $eventId)
    {
        try {
            \Log::info('GoogleCalendarService: Deleting event', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
            ]);

            // リフレッシュトークンでアクセストークンを取得
            $accessToken = $this->getAccessToken($refreshToken);
            
            $this->client->delete("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$eventId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);
            
            \Log::info('GoogleCalendarService: Event deleted successfully', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            \Log::error('GoogleCalendarService: Failed to delete event', [
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
