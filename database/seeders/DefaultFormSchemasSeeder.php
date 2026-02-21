<?php

namespace Database\Seeders;

use App\Models\FormSchema;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultFormSchemasSeeder extends Seeder
{
    /**
     * Seed default MSP change-control form schemas.
     */
    public function run(): void
    {
        $creator = User::query()->orderBy('id')->first();

        if (! $creator) {
            $this->command?->warn('No users found. Skipping default form schema seeding.');

            return;
        }

        $created = 0;
        $existing = 0;

        foreach ($this->templates() as $template) {
            $existingSchema = FormSchema::withTrashed()
                ->where('slug', $template['slug'])
                ->first();

            if ($existingSchema) {
                if ($existingSchema->trashed()) {
                    $existingSchema->restore();
                    $existingSchema->update(['is_active' => true]);
                }

                $existing++;

                continue;
            }

            FormSchema::create([
                'name' => $template['name'],
                'slug' => $template['slug'],
                'description' => $template['description'],
                'schema' => $template['schema'],
                'version' => 1,
                'is_active' => true,
                'created_by' => $creator->id,
            ]);

            $created++;
        }

        $this->command?->info("Default form schemas: {$created} created, {$existing} already existed.");
    }

    /**
     * Build default templates for MSP change-control workflows.
     *
     * @return array<int, array{name: string, slug: string, description: string, schema: array<int, array<string, mixed>>}>
     */
    private function templates(): array
    {
        return [
            [
                'name' => 'Standard Change Control (MSP)',
                'slug' => 'standard-change-control-msp',
                'description' => 'Pre-approved, repeatable low-risk change template for routine MSP operations.',
                'schema' => [
                    $this->field('change_summary', 'text', 'Change Summary', 'change_summary', [
                        'required' => true,
                        'placeholder' => 'Brief summary of the routine change',
                    ]),
                    $this->field('client_name', 'text', 'Client Name', 'client_name', [
                        'required' => true,
                        'placeholder' => 'Client or tenant name',
                    ]),
                    $this->field('service_area', 'select', 'Service Area', 'service_area', [
                        'required' => true,
                        'options' => [
                            'Microsoft 365',
                            'Network',
                            'Server Infrastructure',
                            'Endpoint Management',
                            'Backup and DR',
                            'Identity and Access',
                            'Line-of-Business Application',
                        ],
                    ]),
                    $this->field('change_category', 'select', 'Standard Change Category', 'change_category', [
                        'required' => true,
                        'options' => [
                            'Patching',
                            'Certificate Renewal',
                            'Scheduled Reboot',
                            'Backup Job Adjustment',
                            'Monitoring Tuning',
                            'User Lifecycle Change',
                        ],
                    ]),
                    $this->field('maintenance_date', 'date', 'Maintenance Date', 'maintenance_date', [
                        'required' => true,
                    ]),
                    $this->field('maintenance_window', 'select', 'Maintenance Window', 'maintenance_window', [
                        'required' => true,
                        'options' => [
                            'Business hours',
                            'After hours',
                            'Weekend window',
                        ],
                    ]),
                    $this->field('implementation_steps', 'textarea', 'Implementation Steps', 'implementation_steps', [
                        'required' => true,
                        'rows' => 5,
                        'helpText' => 'List clear, ordered steps for the engineer.',
                    ]),
                    $this->field('validation_steps', 'textarea', 'Validation Steps', 'validation_steps', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('backout_plan', 'textarea', 'Backout Plan', 'backout_plan', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('expected_customer_impact', 'select', 'Expected Customer Impact', 'expected_customer_impact', [
                        'required' => true,
                        'options' => [
                            'No customer impact',
                            'Minor service degradation',
                            'Planned service outage',
                        ],
                    ]),
                    $this->field('risk_rating', 'radio', 'Risk Rating', 'risk_rating', [
                        'required' => true,
                        'options' => ['Low', 'Medium', 'High'],
                    ]),
                    $this->field('engineer_owner', 'text', 'Engineer Owner', 'engineer_owner', [
                        'required' => true,
                        'placeholder' => 'Primary implementation engineer',
                    ]),
                    $this->field('stakeholder_notifications', 'checkbox', 'Stakeholder Notifications', 'stakeholder_notifications', [
                        'options' => [
                            'Service desk notified',
                            'Client primary contact notified',
                            'Monitoring team notified',
                        ],
                    ]),
                    $this->field('post_change_notes', 'textarea', 'Post-Change Notes', 'post_change_notes', [
                        'rows' => 3,
                    ]),
                ],
            ],
            [
                'name' => 'Normal Change Control (MSP)',
                'slug' => 'normal-change-control-msp',
                'description' => 'Planned change template requiring full technical assessment and approval workflow.',
                'schema' => [
                    $this->field('change_summary', 'text', 'Change Summary', 'change_summary', [
                        'required' => true,
                    ]),
                    $this->field('business_justification', 'textarea', 'Business Justification', 'business_justification', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('scope_of_change', 'textarea', 'Scope of Change', 'scope_of_change', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('affected_services', 'checkbox', 'Affected Services', 'affected_services', [
                        'options' => [
                            'Microsoft 365',
                            'Network connectivity',
                            'Server workloads',
                            'Identity and access',
                            'Backup and DR',
                            'Business application',
                        ],
                    ]),
                    $this->field('client_sites_affected', 'textarea', 'Client Sites or Tenants Affected', 'client_sites_affected', [
                        'required' => true,
                        'rows' => 3,
                    ]),
                    $this->field('requested_date', 'date', 'Requested Implementation Date', 'requested_date', [
                        'required' => true,
                    ]),
                    $this->field('planned_start_window', 'datetime', 'Planned Start Window', 'planned_start_window', [
                        'required' => true,
                    ]),
                    $this->field('planned_end_window', 'datetime', 'Planned End Window', 'planned_end_window', [
                        'required' => true,
                    ]),
                    $this->field('downtime_expected', 'select', 'Downtime Expected', 'downtime_expected', [
                        'required' => true,
                        'options' => [
                            'No downtime expected',
                            'Partial service interruption',
                            'Full planned outage',
                        ],
                    ]),
                    $this->field('implementation_plan', 'textarea', 'Implementation Plan', 'implementation_plan', [
                        'required' => true,
                        'rows' => 6,
                    ]),
                    $this->field('validation_test_plan', 'textarea', 'Validation and Test Plan', 'validation_test_plan', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('backout_plan', 'textarea', 'Backout Plan', 'backout_plan', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('risk_assessment', 'textarea', 'Risk Assessment', 'risk_assessment', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('dependencies', 'text', 'Dependencies', 'dependencies', [
                        'placeholder' => 'Vendors, third-party systems, prerequisites',
                    ]),
                    $this->field('vendor_involvement', 'select', 'Vendor Involvement', 'vendor_involvement', [
                        'options' => ['None', 'Microsoft', 'Cisco', 'Fortinet', 'VMware', 'Other'],
                    ]),
                    $this->field('client_approver_name', 'text', 'Client Approver Name', 'client_approver_name', [
                        'required' => true,
                    ]),
                    $this->field('client_approver_email', 'email', 'Client Approver Email', 'client_approver_email', [
                        'required' => true,
                    ]),
                    $this->field('include_additional_approver_emails', 'checkbox', 'Additional Approvers', 'include_additional_approver_emails', [
                        'options' => ['Include additional approver emails'],
                    ]),
                    $this->field('additional_approver_emails', 'textarea', 'Additional Approver Emails', 'additional_approver_emails', [
                        'rows' => 3,
                        'helpText' => 'Enter one email per line.',
                    ]),
                    $this->field('cab_recommendation', 'radio', 'CAB Recommendation', 'cab_recommendation', [
                        'options' => ['Approve', 'Approve with conditions', 'Defer', 'Reject'],
                    ]),
                    $this->field('post_implementation_results', 'textarea', 'Post-Implementation Results', 'post_implementation_results', [
                        'rows' => 4,
                    ]),
                ],
            ],
            [
                'name' => 'Emergency Change Control (MSP)',
                'slug' => 'emergency-change-control-msp',
                'description' => 'Emergency template for urgent changes required to restore service or mitigate active risk.',
                'schema' => [
                    $this->field('emergency_summary', 'text', 'Emergency Summary', 'emergency_summary', [
                        'required' => true,
                    ]),
                    $this->field('incident_reference', 'text', 'Incident Reference', 'incident_reference', [
                        'required' => true,
                        'placeholder' => 'INC-000123 or major incident bridge ID',
                    ]),
                    $this->field('emergency_reason', 'textarea', 'Reason for Emergency Change', 'emergency_reason', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('impacted_service', 'select', 'Impacted Service', 'impacted_service', [
                        'required' => true,
                        'options' => [
                            'Email and collaboration',
                            'Network connectivity',
                            'Server platform',
                            'Identity and access',
                            'Security controls',
                            'Line-of-Business application',
                        ],
                    ]),
                    $this->field('outage_start_date', 'date', 'Outage Start Date', 'outage_start_date', [
                        'required' => true,
                    ]),
                    $this->field('immediate_actions_taken', 'textarea', 'Immediate Actions Taken', 'immediate_actions_taken', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('proposed_fix_plan', 'textarea', 'Proposed Fix Plan', 'proposed_fix_plan', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('rollback_plan', 'textarea', 'Rollback Plan', 'rollback_plan', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('risk_if_delayed', 'textarea', 'Risk if Delayed', 'risk_if_delayed', [
                        'required' => true,
                        'rows' => 3,
                    ]),
                    $this->field('emergency_approver', 'text', 'Emergency Approver', 'emergency_approver', [
                        'required' => true,
                    ]),
                    $this->field('customer_contact_name', 'text', 'Customer Contact Name', 'customer_contact_name'),
                    $this->field('customer_contact_phone', 'phone', 'Customer Contact Phone', 'customer_contact_phone'),
                    $this->field('communications_sent', 'checkbox', 'Communications Sent', 'communications_sent', [
                        'options' => [
                            'Service desk notified',
                            'On-call manager notified',
                            'Client notified',
                            'Status page updated',
                        ],
                    ]),
                    $this->field('restoration_validation', 'textarea', 'Service Restoration Validation', 'restoration_validation', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('pir_required', 'radio', 'Post-Incident Review Required', 'pir_required', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('follow_up_actions', 'textarea', 'Follow-Up Actions', 'follow_up_actions', [
                        'rows' => 3,
                    ]),
                ],
            ],
            [
                'name' => 'Network Change Control (MSP)',
                'slug' => 'network-change-control-msp',
                'description' => 'Template for firewall, routing, switching, and WAN/LAN changes.',
                'schema' => [
                    $this->field('change_summary', 'text', 'Change Summary', 'change_summary', [
                        'required' => true,
                    ]),
                    $this->field('client_name', 'text', 'Client Name', 'client_name', [
                        'required' => true,
                    ]),
                    $this->field('site_or_datacenter', 'text', 'Site or Datacenter', 'site_or_datacenter', [
                        'required' => true,
                    ]),
                    $this->field('device_name', 'text', 'Device Name', 'device_name', [
                        'required' => true,
                    ]),
                    $this->field('vendor_platform', 'select', 'Vendor Platform', 'vendor_platform', [
                        'required' => true,
                        'options' => ['Cisco', 'Fortinet', 'Palo Alto', 'Meraki', 'Ubiquiti', 'Other'],
                    ]),
                    $this->field('network_change_type', 'select', 'Network Change Type', 'network_change_type', [
                        'required' => true,
                        'options' => [
                            'Firewall rule',
                            'VLAN change',
                            'Routing change',
                            'VPN change',
                            'Switch configuration',
                            'Wireless configuration',
                        ],
                    ]),
                    $this->field('config_items_affected', 'textarea', 'Configuration Items Affected', 'config_items_affected', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('maintenance_date', 'date', 'Maintenance Date', 'maintenance_date', [
                        'required' => true,
                    ]),
                    $this->field('maintenance_window', 'text', 'Maintenance Window', 'maintenance_window', [
                        'required' => true,
                        'placeholder' => 'Example: 22:00-23:30 local time',
                    ]),
                    $this->field('pre_change_backup_confirmed', 'radio', 'Pre-Change Backup Confirmed', 'pre_change_backup_confirmed', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('implementation_steps', 'textarea', 'Implementation Steps', 'implementation_steps', [
                        'required' => true,
                        'rows' => 6,
                    ]),
                    $this->field('validation_commands', 'textarea', 'Validation Commands and Checks', 'validation_commands', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('rollback_commands', 'textarea', 'Rollback Commands', 'rollback_commands', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('expected_network_impact', 'select', 'Expected Network Impact', 'expected_network_impact', [
                        'required' => true,
                        'options' => [
                            'No measurable impact',
                            'Minor packet loss possible',
                            'Brief routing interruption',
                            'Planned network outage',
                        ],
                    ]),
                    $this->field('post_change_validation', 'textarea', 'Post-Change Validation Results', 'post_change_validation', [
                        'rows' => 4,
                    ]),
                ],
            ],
            [
                'name' => 'Server and Cloud Infrastructure Change (MSP)',
                'slug' => 'server-cloud-change-control-msp',
                'description' => 'Template for server, virtualization, and cloud platform changes.',
                'schema' => [
                    $this->field('change_summary', 'text', 'Change Summary', 'change_summary', [
                        'required' => true,
                    ]),
                    $this->field('client_name', 'text', 'Client Name', 'client_name', [
                        'required' => true,
                    ]),
                    $this->field('platform', 'select', 'Platform', 'platform', [
                        'required' => true,
                        'options' => ['VMware', 'Hyper-V', 'Azure', 'AWS', 'Google Cloud', 'Physical on-prem'],
                    ]),
                    $this->field('environment', 'select', 'Environment', 'environment', [
                        'required' => true,
                        'options' => ['Production', 'Staging', 'Test', 'Disaster Recovery'],
                    ]),
                    $this->field('host_or_resource_name', 'text', 'Host or Resource Name', 'host_or_resource_name', [
                        'required' => true,
                    ]),
                    $this->field('os_or_service', 'select', 'OS or Service', 'os_or_service', [
                        'required' => true,
                        'options' => ['Windows Server', 'Linux', 'SQL Server', 'Active Directory', 'File Services', 'Other'],
                    ]),
                    $this->field('change_activity', 'select', 'Change Activity', 'change_activity', [
                        'required' => true,
                        'options' => ['OS patching', 'Configuration change', 'Capacity change', 'Migration', 'Decommission', 'Reboot'],
                    ]),
                    $this->field('backup_snapshot_taken', 'radio', 'Backup or Snapshot Taken', 'backup_snapshot_taken', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('maintenance_date', 'date', 'Maintenance Date', 'maintenance_date', [
                        'required' => true,
                    ]),
                    $this->field('implementation_steps', 'textarea', 'Implementation Steps', 'implementation_steps', [
                        'required' => true,
                        'rows' => 6,
                    ]),
                    $this->field('health_checks', 'textarea', 'Health Checks', 'health_checks', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('rollback_plan', 'textarea', 'Rollback Plan', 'rollback_plan', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('expected_downtime_minutes', 'number', 'Expected Downtime (minutes)', 'expected_downtime_minutes', [
                        'min' => 0,
                        'placeholder' => '0',
                    ]),
                    $this->field('stakeholder_comms', 'checkbox', 'Stakeholder Communications', 'stakeholder_comms', [
                        'options' => ['Service desk updated', 'Client IT contact updated', 'NOC monitoring updated'],
                    ]),
                    $this->field('final_outcome', 'select', 'Final Outcome', 'final_outcome', [
                        'options' => ['Successful', 'Successful with issues', 'Failed and rolled back'],
                    ]),
                    $this->field('lessons_learned', 'textarea', 'Lessons Learned', 'lessons_learned', [
                        'rows' => 3,
                    ]),
                ],
            ],
            [
                'name' => 'Identity and Access Change Control (MSP)',
                'slug' => 'identity-access-change-control-msp',
                'description' => 'Template for user access, privilege, and identity platform changes.',
                'schema' => [
                    $this->field('request_summary', 'text', 'Request Summary', 'request_summary', [
                        'required' => true,
                    ]),
                    $this->field('client_name', 'text', 'Client Name', 'client_name', [
                        'required' => true,
                    ]),
                    $this->field('system_application', 'select', 'System or Application', 'system_application', [
                        'required' => true,
                        'options' => ['Microsoft 365', 'Entra ID', 'Active Directory', 'VPN', 'Line-of-Business App', 'PAM Platform', 'Other'],
                    ]),
                    $this->field('request_type', 'select', 'Request Type', 'request_type', [
                        'required' => true,
                        'options' => ['New access', 'Access modification', 'Access removal', 'Privileged access', 'Service account update'],
                    ]),
                    $this->field('user_or_group', 'text', 'User or Group', 'user_or_group', [
                        'required' => true,
                    ]),
                    $this->field('requested_by', 'text', 'Requested By', 'requested_by', [
                        'required' => true,
                    ]),
                    $this->field('approver_name', 'text', 'Approver Name', 'approver_name', [
                        'required' => true,
                    ]),
                    $this->field('approver_email', 'email', 'Approver Email', 'approver_email', [
                        'required' => true,
                    ]),
                    $this->field('least_privilege_confirmed', 'radio', 'Least Privilege Confirmed', 'least_privilege_confirmed', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('mfa_status', 'select', 'MFA Status', 'mfa_status', [
                        'required' => true,
                        'options' => ['Enabled', 'Required but pending', 'Not required by policy'],
                    ]),
                    $this->field('implementation_date', 'date', 'Implementation Date', 'implementation_date', [
                        'required' => true,
                    ]),
                    $this->field('access_change_details', 'textarea', 'Access Change Details', 'access_change_details', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('validation_evidence', 'textarea', 'Validation Evidence', 'validation_evidence', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('rollback_or_remediation_plan', 'textarea', 'Rollback or Remediation Plan', 'rollback_or_remediation_plan', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('notification_sent', 'checkbox', 'Notifications Sent', 'notification_sent', [
                        'options' => ['Requester notified', 'User notified', 'Service desk ticket updated'],
                    ]),
                    $this->field('audit_reference', 'text', 'Audit Reference', 'audit_reference'),
                ],
            ],
            [
                'name' => 'Security Patch Change Control (MSP)',
                'slug' => 'security-patch-change-control-msp',
                'description' => 'Template for planned vulnerability and security patch deployment changes.',
                'schema' => [
                    $this->field('change_summary', 'text', 'Change Summary', 'change_summary', [
                        'required' => true,
                    ]),
                    $this->field('client_name', 'text', 'Client Name', 'client_name', [
                        'required' => true,
                    ]),
                    $this->field('asset_scope', 'textarea', 'Asset Scope', 'asset_scope', [
                        'required' => true,
                        'rows' => 3,
                        'helpText' => 'List affected devices, hosts, or application groups.',
                    ]),
                    $this->field('patch_source', 'select', 'Patch Source', 'patch_source', [
                        'required' => true,
                        'options' => ['Microsoft', 'Linux repository', 'Third-party vendor', 'Network appliance vendor', 'Other'],
                    ]),
                    $this->field('patch_type', 'select', 'Patch Type', 'patch_type', [
                        'required' => true,
                        'options' => ['Operating system', 'Application', 'Firmware', 'Security configuration', 'Endpoint agent'],
                    ]),
                    $this->field('severity_rating', 'select', 'Severity Rating', 'severity_rating', [
                        'required' => true,
                        'options' => ['Critical', 'High', 'Medium', 'Low'],
                    ]),
                    $this->field('testing_completed', 'radio', 'Testing Completed', 'testing_completed', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('testing_notes', 'textarea', 'Testing Notes', 'testing_notes', [
                        'rows' => 3,
                    ]),
                    $this->field('deployment_date', 'date', 'Deployment Date', 'deployment_date', [
                        'required' => true,
                    ]),
                    $this->field('deployment_window', 'text', 'Deployment Window', 'deployment_window', [
                        'required' => true,
                        'placeholder' => 'Example: 23:00-02:00 local time',
                    ]),
                    $this->field('pre_patch_backup_taken', 'radio', 'Pre-Patch Backup Taken', 'pre_patch_backup_taken', [
                        'required' => true,
                        'options' => ['Yes', 'No'],
                    ]),
                    $this->field('implementation_steps', 'textarea', 'Implementation Steps', 'implementation_steps', [
                        'required' => true,
                        'rows' => 5,
                    ]),
                    $this->field('validation_checks', 'textarea', 'Validation Checks', 'validation_checks', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('rollback_plan', 'textarea', 'Rollback Plan', 'rollback_plan', [
                        'required' => true,
                        'rows' => 4,
                    ]),
                    $this->field('customer_communication', 'checkbox', 'Customer Communication', 'customer_communication', [
                        'options' => ['Pre-change notice sent', 'Post-change notice sent', 'Service desk briefed'],
                    ]),
                    $this->field('post_patch_status', 'select', 'Post-Patch Status', 'post_patch_status', [
                        'options' => ['Successful', 'Successful with exceptions', 'Failed and rolled back'],
                    ]),
                    $this->field('outstanding_actions', 'textarea', 'Outstanding Actions', 'outstanding_actions', [
                        'rows' => 3,
                    ]),
                ],
            ],
        ];
    }

    /**
     * Create a normalized form field payload.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function field(string $id, string $type, string $label, string $name, array $extra = []): array
    {
        return array_merge([
            'id' => $id,
            'type' => $type,
            'label' => $label,
            'name' => $name,
            'required' => false,
        ], $extra);
    }
}
