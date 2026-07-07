import { useState } from 'react';
import { Bot, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, priorityTone } from '@/components/ui/Badge';
import { useSummarizeCustomer, useSuggestFollowUps } from '@/hooks/useAi';
import type { AiInsight, FollowUpSuggestion } from '@/types';

interface Props {
  customerId: string;
  latestSummary?: AiInsight;
}

export function AiAssistantCard({ customerId, latestSummary }: Props) {
  const summarize = useSummarizeCustomer(customerId);
  const suggest = useSuggestFollowUps(customerId);
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);

  const summary = summarize.data?.insight.content ?? latestSummary?.content;

  const runSuggest = async () => {
    const res = await suggest.mutateAsync();
    setSuggestions(res.suggestions);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-accent/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Bot className="h-4 w-4 text-white" />
          </span>
          AI Assistant
        </CardTitle>
        <Badge tone="primary" dot>Beta</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interaction summary</p>
            <Button size="sm" variant="outline" onClick={() => summarize.mutate()} loading={summarize.isPending}>
              <Sparkles className="h-3.5 w-3.5" /> {summary ? 'Regenerate' : 'Summarize'}
            </Button>
          </div>
          {summarize.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing interactions…
            </div>
          ) : summary ? (
            <p className="rounded-xl bg-card/60 p-3 text-sm leading-relaxed text-foreground">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Generate an AI summary of this customer's history.</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested follow-ups</p>
            <Button size="sm" variant="outline" onClick={runSuggest} loading={suggest.isPending}>
              <Lightbulb className="h-3.5 w-3.5" /> Suggest
            </Button>
          </div>
          {suggestions.length > 0 ? (
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-card/60 p-3">
                  <Badge tone={priorityTone[s.priority]} className="mt-0.5 shrink-0">{s.priority}</Badge>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Get AI-recommended next actions for this customer.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
