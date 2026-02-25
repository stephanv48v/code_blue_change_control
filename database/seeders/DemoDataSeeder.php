<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\Approval;
use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\ChangeRunbookStep;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\PostImplementationReview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Staff Users ──────────────────────────────────────────────────────

        $sarah = User::firstOrCreate(['email' => 'sarah.mitchell@codeblue.com'], [
            'name'     => 'Sarah Mitchell',
            'password' => Hash::make('password'),
        ]);
        if (! $sarah->hasRole('Change Manager')) {
            $sarah->assignRole('Change Manager');
        }

        $james = User::firstOrCreate(['email' => 'james.chen@codeblue.com'], [
            'name'     => 'James Chen',
            'password' => Hash::make('password'),
        ]);
        if (! $james->hasRole('Engineer')) {
            $james->assignRole('Engineer');
        }

        $amy = User::firstOrCreate(['email' => 'amy.walsh@codeblue.com'], [
            'name'     => 'Amy Walsh',
            'password' => Hash::make('password'),
        ]);
        if (! $amy->hasRole('Engineer')) {
            $amy->assignRole('Engineer');
        }

        $rob = User::firstOrCreate(['email' => 'rob.patel@codeblue.com'], [
            'name'     => 'Rob Patel',
            'password' => Hash::make('password'),
        ]);
        if (! $rob->hasRole('CAB Member')) {
            $rob->assignRole('CAB Member');
        }

        $lisa = User::firstOrCreate(['email' => 'lisa.park@codeblue.com'], [
            'name'     => 'Lisa Park',
            'password' => Hash::make('password'),
        ]);
        if (! $lisa->hasRole('MSP Admin')) {
            $lisa->assignRole('MSP Admin');
        }

        $david = User::firstOrCreate(['email' => 'david.kim@codeblue.com'], [
            'name'     => 'David Kim',
            'password' => Hash::make('password'),
        ]);
        if (! $david->hasRole('CAB Member')) {
            $david->assignRole('CAB Member');
        }

        $nina = User::firstOrCreate(['email' => 'nina.reeves@codeblue.com'], [
            'name'     => 'Nina Reeves',
            'password' => Hash::make('password'),
        ]);
        if (! $nina->hasRole('CAB Member')) {
            $nina->assignRole('CAB Member');
        }

        $engineers = [$james, $amy, $sarah];

        // ── Clients ──────────────────────────────────────────────────────────

        $clientsData = [
            [
                'name'                 => 'Apex Manufacturing Ltd',
                'industry'             => 'Manufacturing',
                'city'                 => 'Auckland',
                'state'                => 'Auckland',
                'country'              => 'NZ',
                'phone'                => '+64 9 555 0100',
                'website'              => 'https://apexmanufacturing.co.nz',
                'notes'                => '200-seat ERP environment. Monthly maintenance windows Sundays 2–6am.',
                'contract_start_date'  => Carbon::now()->subMonths(18),
                'contract_end_date'    => Carbon::now()->addMonths(18),
            ],
            [
                'name'                 => 'Sunrise Healthcare Group',
                'industry'             => 'Healthcare',
                'city'                 => 'Wellington',
                'state'                => 'Wellington',
                'country'              => 'NZ',
                'phone'                => '+64 4 555 0200',
                'website'              => 'https://sunrisehealthcare.co.nz',
                'notes'                => 'Strict HIPAA-equivalent controls. No changes during business hours.',
                'contract_start_date'  => Carbon::now()->subMonths(24),
                'contract_end_date'    => Carbon::now()->addMonths(12),
            ],
            [
                'name'                 => 'Velocity Logistics',
                'industry'             => 'Transport & Logistics',
                'city'                 => 'Christchurch',
                'state'                => 'Canterbury',
                'country'              => 'NZ',
                'phone'                => '+64 3 555 0300',
                'website'              => 'https://velocitylogistics.co.nz',
                'notes'                => 'Fleet management integration. 24/7 operations — change window Friday 11pm–2am.',
                'contract_start_date'  => Carbon::now()->subMonths(12),
                'contract_end_date'    => Carbon::now()->addMonths(24),
            ],
            [
                'name'                 => 'Metro Legal Partners',
                'industry'             => 'Legal Services',
                'city'                 => 'Auckland',
                'state'                => 'Auckland',
                'country'              => 'NZ',
                'phone'                => '+64 9 555 0400',
                'website'              => 'https://metrolegal.co.nz',
                'notes'                => 'Document management and secure file sharing critical. CAB approval required for all server changes.',
                'contract_start_date'  => Carbon::now()->subMonths(6),
                'contract_end_date'    => Carbon::now()->addMonths(30),
            ],
            [
                'name'                 => 'Pacific Property Investments',
                'industry'             => 'Finance & Property',
                'city'                 => 'Hamilton',
                'state'                => 'Waikato',
                'country'              => 'NZ',
                'phone'                => '+64 7 555 0500',
                'website'              => 'https://pacificproperty.co.nz',
                'notes'                => 'Cloud-first environment on Azure. Regular security patches required.',
                'contract_start_date'  => Carbon::now()->subMonths(9),
                'contract_end_date'    => Carbon::now()->addMonths(15),
            ],
        ];

        $clients = [];
        foreach ($clientsData as $cd) {
            $clients[] = Client::firstOrCreate(
                ['name' => $cd['name']],
                array_merge($cd, [
                    'is_active'         => true,
                    'account_manager_id' => $sarah->id,
                ])
            );
        }

        // ── Client Contacts ──────────────────────────────────────────────────

        $contactsData = [
            // Apex Manufacturing
            ['client' => 0, 'first' => 'David',   'last' => 'Thompson', 'email' => 'david.thompson@apexmfg.co.nz',   'title' => 'IT Manager',         'is_approver' => true,  'is_primary' => true],
            ['client' => 0, 'first' => 'Melissa',  'last' => 'Young',    'email' => 'melissa.young@apexmfg.co.nz',   'title' => 'Operations Director', 'is_approver' => true,  'is_primary' => false],
            ['client' => 0, 'first' => 'Tony',     'last' => 'Barnes',   'email' => 'tony.barnes@apexmfg.co.nz',    'title' => 'Helpdesk',            'is_approver' => false, 'is_primary' => false],
            // Sunrise Healthcare
            ['client' => 1, 'first' => 'Karen',    'last' => 'Sullivan', 'email' => 'karen.sullivan@sunrisehealth.co.nz', 'title' => 'CTO',              'is_approver' => true,  'is_primary' => true],
            ['client' => 1, 'first' => 'Mark',     'last' => 'Nguyen',   'email' => 'mark.nguyen@sunrisehealth.co.nz',   'title' => 'Systems Admin',    'is_approver' => false, 'is_primary' => false],
            // Velocity Logistics
            ['client' => 2, 'first' => 'Steve',    'last' => 'Harrison', 'email' => 'steve.harrison@vellog.co.nz',   'title' => 'Head of Technology',  'is_approver' => true,  'is_primary' => true],
            ['client' => 2, 'first' => 'Priya',    'last' => 'Sharma',   'email' => 'priya.sharma@vellog.co.nz',    'title' => 'Network Engineer',    'is_approver' => false, 'is_primary' => false],
            // Metro Legal
            ['client' => 3, 'first' => 'Catherine','last' => 'Moore',    'email' => 'cmoore@metrolegal.co.nz',      'title' => 'Managing Partner',    'is_approver' => true,  'is_primary' => true],
            ['client' => 3, 'first' => 'Ben',       'last' => 'Fletcher', 'email' => 'bfletcher@metrolegal.co.nz', 'title' => 'IT Coordinator',      'is_approver' => true,  'is_primary' => false],
            // Pacific Property
            ['client' => 4, 'first' => 'Natalie',  'last' => 'Cox',      'email' => 'natalie.cox@pacificprop.co.nz','title' => 'Head of IT',          'is_approver' => true,  'is_primary' => true],
        ];

        $contacts = [];
        foreach ($contactsData as $cd) {
            $contacts[] = ClientContact::firstOrCreate(
                ['email' => $cd['email']],
                [
                    'client_id'          => $clients[$cd['client']]->id,
                    'first_name'         => $cd['first'],
                    'last_name'          => $cd['last'],
                    'job_title'          => $cd['title'],
                    'is_primary_contact' => $cd['is_primary'],
                    'is_approver'        => $cd['is_approver'],
                    'is_active'          => true,
                ]
            );
        }

        // ── Helper to create a change request ────────────────────────────────

        $makeChange = function (array $attrs) use ($sarah): ChangeRequest {
            $existing = ChangeRequest::where('title', $attrs['title'])
                ->where('client_id', $attrs['client_id'])
                ->first();
            if ($existing) {
                return $existing;
            }

            $cr = new ChangeRequest(array_merge([
                'requester_id'      => $sarah->id,
                'status'            => 'draft',
                'priority'          => 'medium',
                'change_type'       => 'normal',
                'risk_level'        => 'medium',
                'risk_score'        => 5,
                'implementation_plan'  => 'Follow standard change procedure. Notify stakeholders 48h in advance.',
                'backout_plan'      => 'Restore from backup taken immediately prior to change window.',
                'test_plan'         => 'Verify all services operational after change. Run smoke tests.',
                'business_justification' => 'Required to maintain system stability and security posture.',
            ], $attrs));
            $cr->save();

            return $cr;
        };

        // ── Change Requests ──────────────────────────────────────────────────
        //  Spread over the last 6 months for meaningful trend charts

        $changes = [];

        // ── COMPLETED (18 changes – older dates) ─────────────────────────────

        $completedDefs = [
            ['client' => 0, 'eng' => $james,  'title' => 'Upgrade ERP server OS from Server 2019 to Server 2022',           'type' => 'server_cloud',    'priority' => 'high',     'risk' => 'high',   'months_ago' => 6],
            ['client' => 1, 'eng' => $amy,    'title' => 'Deploy SSL certificate renewal across web services',               'type' => 'security_patch',  'priority' => 'high',     'risk' => 'low',    'months_ago' => 5],
            ['client' => 2, 'eng' => $james,  'title' => 'Migrate fleet management database to new SQL Server instance',     'type' => 'server_cloud',    'priority' => 'high',     'risk' => 'high',   'months_ago' => 5],
            ['client' => 0, 'eng' => $amy,    'title' => 'Apply August Patch Tuesday security updates',                      'type' => 'security_patch',  'priority' => 'medium',   'risk' => 'low',    'months_ago' => 5],
            ['client' => 3, 'eng' => $james,  'title' => 'Configure MFA for all staff Microsoft 365 accounts',              'type' => 'identity_access', 'priority' => 'high',     'risk' => 'medium', 'months_ago' => 4],
            ['client' => 4, 'eng' => $amy,    'title' => 'Expand Azure storage capacity for document archive',              'type' => 'server_cloud',    'priority' => 'medium',   'risk' => 'low',    'months_ago' => 4],
            ['client' => 1, 'eng' => $james,  'title' => 'Reconfigure VLAN segmentation for clinical network',              'type' => 'network',         'priority' => 'high',     'risk' => 'high',   'months_ago' => 4],
            ['client' => 2, 'eng' => $amy,    'title' => 'Apply September Patch Tuesday security updates',                  'type' => 'security_patch',  'priority' => 'medium',   'risk' => 'low',    'months_ago' => 3],
            ['client' => 0, 'eng' => $james,  'title' => 'Deploy new Wi-Fi access points across factory floor',             'type' => 'network',         'priority' => 'medium',   'risk' => 'medium', 'months_ago' => 3],
            ['client' => 3, 'eng' => $amy,    'title' => 'Upgrade practice management software to v4.2',                    'type' => 'standard',        'priority' => 'medium',   'risk' => 'medium', 'months_ago' => 3],
            ['client' => 4, 'eng' => $james,  'title' => 'Implement Conditional Access policies in Azure AD',               'type' => 'identity_access', 'priority' => 'high',     'risk' => 'medium', 'months_ago' => 3],
            ['client' => 1, 'eng' => $amy,    'title' => 'Apply October Patch Tuesday security updates',                    'type' => 'security_patch',  'priority' => 'medium',   'risk' => 'low',    'months_ago' => 2],
            ['client' => 2, 'eng' => $james,  'title' => 'Migrate email infrastructure from on-prem to Microsoft 365',     'type' => 'server_cloud',    'priority' => 'critical', 'risk' => 'high',   'months_ago' => 2],
            ['client' => 0, 'eng' => $amy,    'title' => 'Replace aging core network switch (Cisco 3750)',                  'type' => 'network',         'priority' => 'high',     'risk' => 'medium', 'months_ago' => 2],
            ['client' => 3, 'eng' => $james,  'title' => 'Deploy Microsoft Defender for Business across all endpoints',    'type' => 'security_patch',  'priority' => 'high',     'risk' => 'medium', 'months_ago' => 2],
            ['client' => 4, 'eng' => $amy,    'title' => 'Configure site-to-site VPN to new Hamilton office',              'type' => 'network',         'priority' => 'medium',   'risk' => 'medium', 'months_ago' => 1],
            ['client' => 1, 'eng' => $james,  'title' => 'Apply November Patch Tuesday security updates',                  'type' => 'security_patch',  'priority' => 'medium',   'risk' => 'low',    'months_ago' => 1],
            ['client' => 0, 'eng' => $amy,    'title' => 'Upgrade VMware ESXi hosts to v8.0 U2',                           'type' => 'server_cloud',    'priority' => 'high',     'risk' => 'high',   'months_ago' => 1],
        ];

        foreach ($completedDefs as $def) {
            $start = Carbon::now()->subMonths($def['months_ago'])->subDays(rand(0, 10));
            $end   = $start->copy()->addDays(rand(1, 5));
            $cr = $makeChange([
                'client_id'             => $clients[$def['client']]->id,
                'requester_id'          => $def['eng']->id,
                'assigned_engineer_id'  => $def['eng']->id,
                'title'                 => $def['title'],
                'change_type'           => $def['type'],
                'priority'              => $def['priority'],
                'risk_level'            => $def['risk'],
                'status'                => 'completed',
                'scheduled_start_date'  => $start,
                'scheduled_end_date'    => $start->copy()->addHours(4),
                'actual_start_date'     => $start,
                'actual_end_date'       => $end,
                'approved_by'           => $sarah->id,
                'approved_at'           => $start->copy()->subDays(2),
                'created_at'            => $start->copy()->subDays(7),
            ]);
            $changes[] = $cr;

            // Add PIR for completed changes
            if (! $cr->postImplementationReview()->exists()) {
                PostImplementationReview::create([
                    'change_request_id' => $cr->id,
                    'reviewed_by'       => $def['eng']->id,
                    'outcome'           => 'success',
                    'summary'           => 'Change completed within maintenance window. No service disruption. All smoke tests passed.',
                    'lessons_learned'   => 'Ensure all stakeholders are notified at least 48h in advance for high-risk changes.',
                    'reviewed_at'       => $end->copy()->addDays(1),
                ]);
            }
        }

        // ── IN PROGRESS (4 changes) ──────────────────────────────────────────

        $inProgressDefs = [
            ['client' => 0, 'eng' => $james, 'title' => 'Replace UPS units in server room A and B',                'type' => 'standard',    'priority' => 'high',   'risk' => 'high'],
            ['client' => 2, 'eng' => $amy,   'title' => 'Upgrade WAN links from 100Mbps to 1Gbps fibre',          'type' => 'network',     'priority' => 'high',   'risk' => 'medium'],
            ['client' => 3, 'eng' => $james, 'title' => 'Migrate document management system to SharePoint Online', 'type' => 'server_cloud','priority' => 'medium',  'risk' => 'medium'],
            ['client' => 4, 'eng' => $amy,   'title' => 'Deploy Azure Sentinel SIEM solution',                    'type' => 'security_patch','priority' => 'high',  'risk' => 'high'],
        ];

        $runbookTemplates = [
            ['Pre-change backup of configuration', ['Pre-change backup taken and verified — backup ID BK-{n}', 'Backup size confirmed: 4.2GB', 'Restore test passed']],
            ['Notify stakeholders and confirm maintenance window', ['Client IT contact notified via email', 'Maintenance window confirmed for {time}', 'On-call engineer briefed']],
            ['Implement change per procedure', ['Started implementation', 'Progress 50% — no issues', 'Implementation complete']],
            ['Smoke test and validation', ['Core services online', 'User acceptance test passed', 'Performance metrics normal']],
            ['Post-change documentation', ['Change log updated', 'CMDB updated with new configuration', 'Change request closed']],
        ];

        foreach ($inProgressDefs as $i => $def) {
            $start = Carbon::now()->subHours(rand(2, 8));
            $cr = $makeChange([
                'client_id'             => $clients[$def['client']]->id,
                'requester_id'          => $def['eng']->id,
                'assigned_engineer_id'  => $def['eng']->id,
                'title'                 => $def['title'],
                'change_type'           => $def['type'],
                'priority'              => $def['priority'],
                'risk_level'            => $def['risk'],
                'status'                => 'in_progress',
                'scheduled_start_date'  => $start,
                'scheduled_end_date'    => $start->copy()->addHours(6),
                'actual_start_date'     => $start,
                'approved_by'           => $sarah->id,
                'approved_at'           => Carbon::now()->subDays(2),
                'created_at'            => Carbon::now()->subDays(10),
            ]);
            $changes[] = $cr;

            // Runbook steps – 3 complete, 2 pending
            if ($cr->runbookSteps()->count() === 0) {
                foreach ($runbookTemplates as $j => [$label]) {
                    ChangeRunbookStep::create([
                        'change_request_id' => $cr->id,
                        'step_order'        => $j + 1,
                        'title'             => $label,
                        'status'            => $j < 3 ? 'completed' : 'pending',
                        'completed_by'      => $j < 3 ? $def['eng']->id : null,
                        'completed_at'      => $j < 3 ? $start->copy()->addMinutes(($j + 1) * 30) : null,
                    ]);
                }
            }
        }

        // ── SCHEDULED (5 changes) ────────────────────────────────────────────

        $scheduledDefs = [
            ['client' => 1, 'eng' => $amy,   'title' => 'December Patch Tuesday — all healthcare endpoints',          'type' => 'security_patch',  'priority' => 'medium', 'risk' => 'low',    'days' => 4],
            ['client' => 0, 'eng' => $james, 'title' => 'Expand SAN storage by 20TB for manufacturing archive',       'type' => 'server_cloud',    'priority' => 'high',   'risk' => 'medium', 'days' => 7],
            ['client' => 3, 'eng' => $james, 'title' => 'Enable Microsoft Purview information protection labels',     'type' => 'identity_access', 'priority' => 'medium', 'risk' => 'low',    'days' => 5],
            ['client' => 2, 'eng' => $amy,   'title' => 'Deploy SD-WAN across three Christchurch distribution hubs', 'type' => 'network',         'priority' => 'high',   'risk' => 'high',   'days' => 14],
            ['client' => 4, 'eng' => $james, 'title' => 'Configure automated Azure backup retention policy',          'type' => 'server_cloud',    'priority' => 'low',    'risk' => 'low',    'days' => 3],
        ];

        foreach ($scheduledDefs as $def) {
            $sched = Carbon::now()->addDays($def['days'])->setHour(22)->setMinute(0);
            $cr = $makeChange([
                'client_id'             => $clients[$def['client']]->id,
                'requester_id'          => $def['eng']->id,
                'assigned_engineer_id'  => $def['eng']->id,
                'title'                 => $def['title'],
                'change_type'           => $def['type'],
                'priority'              => $def['priority'],
                'risk_level'            => $def['risk'],
                'status'                => 'scheduled',
                'scheduled_start_date'  => $sched,
                'scheduled_end_date'    => $sched->copy()->addHours(4),
                'approved_by'           => $sarah->id,
                'approved_at'           => Carbon::now()->subDays(1),
                'created_at'            => Carbon::now()->subDays(8),
            ]);
            $changes[] = $cr;
        }

        // ── APPROVED (4 changes) ─────────────────────────────────────────────

        $approvedDefs = [
            ['client' => 0, 'eng' => $amy,   'title' => 'Replace legacy Active Directory with Microsoft Entra hybrid join', 'type' => 'identity_access', 'priority' => 'high',     'risk' => 'high'],
            ['client' => 1, 'eng' => $james, 'title' => 'Upgrade clinical imaging workstations to Windows 11',              'type' => 'standard',        'priority' => 'medium',   'risk' => 'medium'],
            ['client' => 4, 'eng' => $amy,   'title' => 'Implement Azure Front Door for web application gateway',           'type' => 'network',         'priority' => 'medium',   'risk' => 'medium'],
            ['client' => 2, 'eng' => $james, 'title' => 'Migrate legacy VPN concentrator to Meraki MX',                   'type' => 'network',         'priority' => 'high',     'risk' => 'high'],
        ];

        foreach ($approvedDefs as $def) {
            $cr = $makeChange([
                'client_id'             => $clients[$def['client']]->id,
                'requester_id'          => $def['eng']->id,
                'assigned_engineer_id'  => $def['eng']->id,
                'title'                 => $def['title'],
                'change_type'           => $def['type'],
                'priority'              => $def['priority'],
                'risk_level'            => $def['risk'],
                'status'                => 'approved',
                'approved_by'           => $sarah->id,
                'approved_at'           => Carbon::now()->subDays(rand(1, 3)),
                'created_at'            => Carbon::now()->subDays(rand(10, 14)),
            ]);
            $changes[] = $cr;
        }

        // ── PENDING APPROVAL (5 changes) ─────────────────────────────────────

        $pendingDefs = [
            ['client' => 3, 'eng' => $james, 'title' => 'Deploy Intune MDM for all staff mobile devices',               'type' => 'identity_access', 'priority' => 'medium', 'risk' => 'medium', 'cab' => false],
            ['client' => 1, 'eng' => $amy,   'title' => 'Emergency: Patch critical CVE-2024-43491 on patient systems',  'type' => 'emergency',       'priority' => 'critical','risk' => 'high',   'cab' => true],
            ['client' => 0, 'eng' => $james, 'title' => 'Implement DMARC, DKIM, SPF for all client email domains',     'type' => 'security_patch',  'priority' => 'high',   'risk' => 'medium', 'cab' => false],
            ['client' => 4, 'eng' => $amy,   'title' => 'Upgrade Veeam Backup to v12 and add immutable repository',    'type' => 'server_cloud',    'priority' => 'high',   'risk' => 'medium', 'cab' => true],
            ['client' => 2, 'eng' => $james, 'title' => 'Replace end-of-life Cisco ASA firewall with Meraki MX250',    'type' => 'network',         'priority' => 'critical','risk' => 'high',   'cab' => true],
        ];

        foreach ($pendingDefs as $i => $def) {
            $cr = $makeChange([
                'client_id'             => $clients[$def['client']]->id,
                'requester_id'          => $def['eng']->id,
                'assigned_engineer_id'  => $def['eng']->id,
                'title'                 => $def['title'],
                'change_type'           => $def['type'],
                'priority'              => $def['priority'],
                'risk_level'            => $def['risk'],
                'status'                => 'pending_approval',
                'requires_cab_approval' => $def['cab'],
                'created_at'            => Carbon::now()->subDays(rand(3, 7)),
            ]);
            $changes[] = $cr;

            // Create a pending approval record
            if ($cr->approvals()->count() === 0) {
                $approverContact = ClientContact::where('client_id', $clients[$def['client']]->id)
                    ->where('is_approver', true)
                    ->first();
                if ($approverContact) {
                    Approval::create([
                        'change_request_id'  => $cr->id,
                        'type'               => Approval::TYPE_CLIENT,
                        'client_contact_id'  => $approverContact->id,
                        'status'             => Approval::STATUS_PENDING,
                        'due_at'             => Carbon::now()->addDays(2),
                    ]);
                }
                if ($def['cab']) {
                    Approval::create([
                        'change_request_id' => $cr->id,
                        'type'              => Approval::TYPE_CAB,
                        'user_id'           => $rob->id,
                        'status'            => Approval::STATUS_PENDING,
                        'due_at'            => Carbon::now()->addDays(3),
                    ]);
                }
            }
        }

        // ── SUBMITTED (4 changes) ────────────────────────────────────────────

        $submittedDefs = [
            ['client' => 0, 'eng' => $amy,   'title' => 'Upgrade storage controllers firmware on NetApp FAS8300',       'type' => 'server_cloud',    'priority' => 'medium', 'risk' => 'medium'],
            ['client' => 3, 'eng' => $james, 'title' => 'Configure Teams Phone System to replace PBX',                  'type' => 'normal',          'priority' => 'medium', 'risk' => 'low'],
            ['client' => 1, 'eng' => $amy,   'title' => 'Deploy Sysmon and enhance Windows Event logging',              'type' => 'security_patch',  'priority' => 'medium', 'risk' => 'low'],
            ['client' => 4, 'eng' => $james, 'title' => 'Implement Just-in-Time VM access via Microsoft Defender',      'type' => 'identity_access', 'priority' => 'high',   'risk' => 'medium'],
        ];

        foreach ($submittedDefs as $def) {
            $cr = $makeChange([
                'client_id'    => $clients[$def['client']]->id,
                'requester_id' => $def['eng']->id,
                'title'        => $def['title'],
                'change_type'  => $def['type'],
                'priority'     => $def['priority'],
                'risk_level'   => $def['risk'],
                'status'       => 'submitted',
                'created_at'   => Carbon::now()->subDays(rand(1, 4)),
            ]);
            $changes[] = $cr;
        }

        // ── DRAFT (3 changes) ────────────────────────────────────────────────

        $draftDefs = [
            ['client' => 2, 'eng' => $james, 'title' => 'Evaluate and implement Zero Trust Network Access (ZTNA)',      'type' => 'network',         'priority' => 'medium', 'risk' => 'medium'],
            ['client' => 0, 'eng' => $amy,   'title' => 'Upgrade manufacturing MES software to v7.1',                  'type' => 'standard',        'priority' => 'low',    'risk' => 'medium'],
            ['client' => 3, 'eng' => $james, 'title' => 'Implement password-less authentication via FIDO2 keys',       'type' => 'identity_access', 'priority' => 'medium', 'risk' => 'medium'],
        ];

        foreach ($draftDefs as $def) {
            $makeChange([
                'client_id'    => $clients[$def['client']]->id,
                'requester_id' => $def['eng']->id,
                'title'        => $def['title'],
                'change_type'  => $def['type'],
                'priority'     => $def['priority'],
                'risk_level'   => $def['risk'],
                'status'       => 'draft',
                'created_at'   => Carbon::now()->subDays(rand(1, 3)),
            ]);
        }

        // ── REJECTED (2 changes) ─────────────────────────────────────────────

        $rejectedDefs = [
            ['client' => 1, 'eng' => $amy,   'title' => 'Migrate on-prem Exchange to Exchange Online (incomplete scope)',   'type' => 'server_cloud', 'priority' => 'high', 'risk' => 'high',   'reason' => 'Change scope too broad. Requires more detailed impact assessment and phased approach before resubmission.'],
            ['client' => 0, 'eng' => $james, 'title' => 'Replace all office PCs with thin clients (out of scope)',          'type' => 'standard',     'priority' => 'low',  'risk' => 'medium', 'reason' => 'Outside current contract scope. Requires separate project agreement and budget approval.'],
        ];

        foreach ($rejectedDefs as $def) {
            $cr = $makeChange([
                'client_id'        => $clients[$def['client']]->id,
                'requester_id'     => $def['eng']->id,
                'title'            => $def['title'],
                'change_type'      => $def['type'],
                'priority'         => $def['priority'],
                'risk_level'       => $def['risk'],
                'status'           => 'rejected',
                'rejection_reason' => $def['reason'],
                'approved_by'      => $sarah->id,
                'approved_at'      => Carbon::now()->subDays(rand(5, 10)),
                'created_at'       => Carbon::now()->subDays(rand(14, 20)),
            ]);
            if ($cr->approvals()->count() === 0) {
                Approval::create([
                    'change_request_id' => $cr->id,
                    'type'              => Approval::TYPE_CAB,
                    'user_id'           => $rob->id,
                    'status'            => Approval::STATUS_REJECTED,
                    'comments'          => $def['reason'],
                    'responded_at'      => Carbon::now()->subDays(rand(4, 8)),
                ]);
            }
        }

        // ── CANCELLED (2 changes) ────────────────────────────────────────────

        $cancelledDefs = [
            ['client' => 4, 'eng' => $james, 'title' => 'Implement third-party SSO provider (deferred)',                   'type' => 'identity_access', 'priority' => 'low',    'risk' => 'low'],
            ['client' => 3, 'eng' => $amy,   'title' => 'Migrate legacy file server to NAS (client decided cloud-first)', 'type' => 'server_cloud',    'priority' => 'medium', 'risk' => 'medium'],
        ];

        foreach ($cancelledDefs as $def) {
            $makeChange([
                'client_id'    => $clients[$def['client']]->id,
                'requester_id' => $def['eng']->id,
                'title'        => $def['title'],
                'change_type'  => $def['type'],
                'priority'     => $def['priority'],
                'risk_level'   => $def['risk'],
                'status'       => 'cancelled',
                'created_at'   => Carbon::now()->subDays(rand(20, 30)),
            ]);
        }

        // ── CAB Meetings ───────────────────────────────────────────────────

        $todayMeeting = CabMeeting::firstOrCreate(
            ['meeting_date' => Carbon::today()->setTime(9, 0)],
            [
                'status' => CabMeeting::STATUS_PLANNED,
                'created_by' => $sarah->id,
                'talking_points' => [
                    ['id' => Str::uuid()->toString(), 'text' => 'Review high-risk change backout plans', 'checked' => true],
                    ['id' => Str::uuid()->toString(), 'text' => 'Confirm client notification windows for scheduled changes', 'checked' => false],
                    ['id' => Str::uuid()->toString(), 'text' => 'Discuss emergency change threshold policy', 'checked' => false],
                    ['id' => Str::uuid()->toString(), 'text' => 'Review outstanding CAB conditions awaiting confirmation', 'checked' => false],
                ],
            ]
        );

        // Attach pending-approval changes that require CAB to today's meeting
        $cabPendingIds = ChangeRequest::where('status', 'pending_approval')
            ->where('requires_cab_approval', true)
            ->pluck('id')
            ->all();
        if (count($cabPendingIds) > 0) {
            $syncData = collect($cabPendingIds)
                ->mapWithKeys(fn ($id) => [(int) $id => ['decision' => 'pending']])
                ->all();
            $todayMeeting->changeRequests()->syncWithoutDetaching($syncData);
        }

        // Past completed meeting
        $pastMeeting = CabMeeting::firstOrCreate(
            ['meeting_date' => Carbon::today()->subWeek()->setTime(9, 0)],
            [
                'status' => CabMeeting::STATUS_COMPLETED,
                'created_by' => $sarah->id,
                'completed_by' => $sarah->id,
                'completed_at' => Carbon::today()->subWeek()->setTime(10, 30),
                'agenda_notes' => 'Weekly CAB review. All standard changes approved.',
                'minutes' => 'Reviewed 3 standard changes. All approved with no conditions. Emergency patch for healthcare systems fast-tracked.',
                'talking_points' => [
                    ['id' => Str::uuid()->toString(), 'text' => 'Review weekly change summary', 'checked' => true],
                    ['id' => Str::uuid()->toString(), 'text' => 'Approve standard patches', 'checked' => true],
                    ['id' => Str::uuid()->toString(), 'text' => 'Discuss upcoming maintenance windows', 'checked' => true],
                ],
            ]
        );

        // Invite all CAB members to meetings
        $cabMemberUsers = User::role('CAB Member')->get();
        $cabMemberIds = $cabMemberUsers->pluck('id');
        foreach ([$todayMeeting, $pastMeeting] as $meeting) {
            $meeting->invitedMembers()->syncWithoutDetaching($cabMemberIds);
        }

        // ── Default CAB Settings ───────────────────────────────────────────

        $cabDefaults = [
            'cab.quorum' => '3',
            'cab.emergency_quorum' => '1',
            'cab.auto_populate_agenda' => '1',
            'cab.default_meeting_time' => '09:00',
            'cab.notify_client_on_decision' => '1',
            'cab.notify_client_on_conditions' => '1',
            'cab.notify_requester_on_approval' => '1',
            'cab.notify_requester_on_rejection' => '1',
            'cab.notify_requester_on_conditions' => '1',
            'cab.allow_vote_changes' => '1',
            'cab.require_rejection_comments' => '1',
            'cab.sla_hours_standard' => '48',
            'cab.sla_hours_emergency' => '4',
        ];

        foreach ($cabDefaults as $key => $value) {
            AppSetting::set($key, $value);
        }

        $this->command->info('');
        $this->command->info('Demo data seeded successfully!');
        $this->command->info('');
        $this->command->info('Staff logins (password: password):');
        $this->command->info('  Change Manager : sarah.mitchell@codeblue.com');
        $this->command->info('  Engineer       : james.chen@codeblue.com');
        $this->command->info('  Engineer       : amy.walsh@codeblue.com');
        $this->command->info('  CAB Member     : rob.patel@codeblue.com');
        $this->command->info('  CAB Member     : david.kim@codeblue.com');
        $this->command->info('  CAB Member     : nina.reeves@codeblue.com');
        $this->command->info('  MSP Admin      : lisa.park@codeblue.com');
        $this->command->info('');
        $this->command->info('Clients: Apex Manufacturing, Sunrise Healthcare, Velocity Logistics,');
        $this->command->info('         Metro Legal Partners, Pacific Property Investments');
        $this->command->info('');
        $this->command->info('Change requests: 18 completed, 4 in-progress, 5 scheduled,');
        $this->command->info('                 4 approved, 5 pending approval, 4 submitted,');
        $this->command->info('                 3 draft, 2 rejected, 2 cancelled (= 47 total)');
    }
}
