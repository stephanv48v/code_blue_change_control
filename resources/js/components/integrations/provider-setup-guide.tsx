import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProviderSetupGuide } from '@/lib/integration-provider-meta';

type Props = {
    provider: string;
    providerLabel?: string;
    webhookPath?: string;
};

export default function ProviderSetupGuide({
    provider,
    providerLabel,
    webhookPath = '/webhooks/integrations/{integration_id}',
}: Props) {
    const guide = getProviderSetupGuide(provider);
    const title = providerLabel || provider;

    return (
        <Card>
            <CardHeader>
                <CardTitle>How To Connect {title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">{guide.summary}</p>

                <section className="space-y-2">
                    <h4 className="font-medium">Required Credentials</h4>
                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {guide.requiredCredentials.map((key) => (
                            <li key={key}>
                                <code>{key}</code>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-medium">Setup Steps</h4>
                    <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                        {guide.setupSteps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </section>

                <section className="space-y-2">
                    <h4 className="font-medium">Recommended Settings</h4>
                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {guide.recommendedSettings.map((setting) => (
                            <li key={setting}>
                                <code>{setting}</code>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-medium">Webhook Endpoint</h4>
                    <p className="text-muted-foreground">
                        Configure outbound webhooks to post to <code>{webhookPath}</code> and send your secret as
                        <code> X-Integration-Token</code>.
                    </p>
                </section>
            </CardContent>
        </Card>
    );
}
