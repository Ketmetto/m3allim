import { Footer, RoleNav } from '../../components/layout.jsx';
import { Button, Card, Icon } from '../../components/ui.jsx';

export default function NotFound() {
  return (
    <>
      <RoleNav />
      <div className="container page">
        <Card className="empty">
          <Icon name="Search" size={28} color="var(--gray)" />
          <h1 className="h3">Page not found</h1>
          <p className="muted">That link doesn’t lead anywhere on M3allim.</p>
          <div className="row gap-12 wrap"><Button to="/">Go home</Button><Button variant="outline" to="/mentors">Find a mentor</Button></div>
        </Card>
      </div>
      <Footer />
    </>
  );
}
