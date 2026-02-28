<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CabSettingsController extends Controller
{
    public function index(): Response
    {
        $this->authorize('users.manage');

        $settings = [
            'cab.quorum' => (int) AppSetting::get('cab.quorum', 3),
            'cab.emergency_quorum' => (int) AppSetting::get('cab.emergency_quorum', 1),
            'cab.auto_populate_agenda' => (bool) AppSetting::get('cab.auto_populate_agenda', true),
            'cab.default_meeting_time' => AppSetting::get('cab.default_meeting_time', '09:00'),
            'cab.notify_client_on_decision' => (bool) AppSetting::get('cab.notify_client_on_decision', true),
            'cab.notify_client_on_conditions' => (bool) AppSetting::get('cab.notify_client_on_conditions', true),
            'cab.notify_requester_on_approval' => (bool) AppSetting::get('cab.notify_requester_on_approval', true),
            'cab.notify_requester_on_rejection' => (bool) AppSetting::get('cab.notify_requester_on_rejection', true),
            'cab.notify_requester_on_conditions' => (bool) AppSetting::get('cab.notify_requester_on_conditions', true),
            'cab.allow_vote_changes' => (bool) AppSetting::get('cab.allow_vote_changes', true),
            'cab.require_rejection_comments' => (bool) AppSetting::get('cab.require_rejection_comments', true),
            'cab.sla_hours_standard' => (int) AppSetting::get('cab.sla_hours_standard', 48),
            'cab.sla_hours_emergency' => (int) AppSetting::get('cab.sla_hours_emergency', 4),
        ];

        return Inertia::render('Admin/CabSettings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'cab_quorum' => 'required|integer|min:1|max:20',
            'cab_emergency_quorum' => 'required|integer|min:1|max:10',
            'cab_auto_populate_agenda' => 'required|boolean',
            'cab_default_meeting_time' => 'required|string|date_format:H:i',
            'cab_notify_client_on_decision' => 'required|boolean',
            'cab_notify_client_on_conditions' => 'required|boolean',
            'cab_notify_requester_on_approval' => 'required|boolean',
            'cab_notify_requester_on_rejection' => 'required|boolean',
            'cab_notify_requester_on_conditions' => 'required|boolean',
            'cab_allow_vote_changes' => 'required|boolean',
            'cab_require_rejection_comments' => 'required|boolean',
            'cab_sla_hours_standard' => 'required|integer|min:1|max:720',
            'cab_sla_hours_emergency' => 'required|integer|min:1|max:168',
        ]);

        $settingsMap = [
            'cab_quorum' => 'cab.quorum',
            'cab_emergency_quorum' => 'cab.emergency_quorum',
            'cab_auto_populate_agenda' => 'cab.auto_populate_agenda',
            'cab_default_meeting_time' => 'cab.default_meeting_time',
            'cab_notify_client_on_decision' => 'cab.notify_client_on_decision',
            'cab_notify_client_on_conditions' => 'cab.notify_client_on_conditions',
            'cab_notify_requester_on_approval' => 'cab.notify_requester_on_approval',
            'cab_notify_requester_on_rejection' => 'cab.notify_requester_on_rejection',
            'cab_notify_requester_on_conditions' => 'cab.notify_requester_on_conditions',
            'cab_allow_vote_changes' => 'cab.allow_vote_changes',
            'cab_require_rejection_comments' => 'cab.require_rejection_comments',
            'cab_sla_hours_standard' => 'cab.sla_hours_standard',
            'cab_sla_hours_emergency' => 'cab.sla_hours_emergency',
        ];

        foreach ($validated as $formKey => $value) {
            $settingKey = $settingsMap[$formKey] ?? $formKey;
            AppSetting::set($settingKey, is_bool($value) ? ($value ? '1' : '0') : (string) $value);
        }

        return back()->with('message', 'CAB settings updated successfully.');
    }
}
