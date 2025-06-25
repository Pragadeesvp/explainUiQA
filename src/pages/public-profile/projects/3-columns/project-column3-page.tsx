import { Fragment } from 'react';
import { PageMenu } from '@/pages/public-profile';
import { UserHero } from '@/partials/common/user-hero';
import { DropdownMenu9 } from '@/partials/dropdown-menu/dropdown-menu-9';
import { Navbar, NavbarActions } from '@/partials/navbar/navbar';
import {
  EllipsisVertical,
  Mail,
  MapPin,
  MessageCircleMore,
  MessagesSquare,
  Users,
  Zap,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { ChatSheet } from '@/partials/topbar/chat-sheet';
import { Projects2 } from './components';

export function ProjectColumn3Page() {
  const image = (
    <img
      src={toAbsoluteUrl('/media/avatars/300-1.png')}
      className="rounded-full border-3 border-green-500 h-[100px] shrink-0"
      alt="image"
    />
  );

  return (
    
    <div className="relative">
      <Fragment>
      <Container>
        <Navbar>
          <PageMenu />
          {/* <NavbarActions>
            <Button>
              <Users /> Connect
            </Button>
            <Button variant="outline" mode="icon">
              <MessagesSquare />
            </Button>
            <DropdownMenu9
              trigger={
                <Button variant="outline" mode="icon">
                  <EllipsisVertical />
                </Button>
              }
            />
          </NavbarActions> */}
        </Navbar>
      </Container>
      <Container>
        <Projects2 />
      </Container>
      </Fragment>

      {/* Floating Chat Button */}
      <ChatSheet
        trigger={
          <Button
            className="fixed right-6 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-[#00d1ff] text-black hover:bg-[#00d1ff]/90 border-[#00d1ff]"
            mode="icon"
            size="lg"
          >
            <MessageCircleMore className="h-6 w-6" />
          </Button>
        }
      />
    </div>
  );
}
