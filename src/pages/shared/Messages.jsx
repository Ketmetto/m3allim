// Chat for students, mentors and admins. Admins can start a conversation with anyone from Users & bans.
import { RoleLayout } from '../../components/layout';
import { ChatWindow } from '../../components/chat/ChatWindow.jsx';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../config/roles.js';

const COPY = {
  [ROLES.STUDENT]: { sub: 'Chat with your mentors before and after each session.', empty: 'Open a mentor’s profile and tap Message to start a conversation.', action: <Button variant="outline" to="/mentors">Find a mentor</Button> },
  [ROLES.MENTOR]: { sub: 'Chat with your students, and reply to the M3allim team.', empty: 'When a student or an admin writes to you, the conversation shows here.' },
  staff: { sub: 'Talk directly with students and mentors.', empty: 'Start a conversation from Users & bans, a report or a support ticket.', action: <Button variant="outline" to="/admin/users">Go to users</Button> },
};

export default function Messages() {
  const { role, isStaff } = useAuth();
  const copy = COPY[isStaff ? 'staff' : role] || COPY[ROLES.STUDENT];
  return (
    <RoleLayout title="Messages" sub={copy.sub}>
      <ChatWindow emptyText={copy.empty} emptyAction={copy.action} />
    </RoleLayout>
  );
}
