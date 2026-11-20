import { SiteLayout } from '../../components/layout';
import { Button, Card, EmptyState } from '../../components/ui';

export default function NotFound() {
  return (
    <SiteLayout footer>
      <Card>
        <EmptyState icon="Search" title="Page not found" text="That link doesn’t lead anywhere on M3allim.">
          <div className="row gap-12 wrap"><Button to="/">Go home</Button><Button variant="outline" to="/mentors">Find a mentor</Button></div>
        </EmptyState>
      </Card>
    </SiteLayout>
  );
}
