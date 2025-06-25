import { ReactNode, useState } from 'react';
import {
  Calendar,
  Mic,
  MoreVertical,
  Settings2,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AvatarGroup } from '../common/avatar-group';

export function ChatSheet({ trigger }: { trigger: ReactNode }) {
  const [emailInput, setEmailInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);



  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="p-0 gap-0 sm:w-[450px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5"
        overlay={false}
      >
        <SheetHeader>
          <div className="flex items-center justify-between p-3 border-b border-border">
            <SheetTitle>AI Assistant</SheetTitle>
          </div>
          
        </SheetHeader>
        <SheetBody className="scrollable-y-auto grow flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Start a conversation...</p>
          </div>
        </SheetBody>
        <SheetFooter className="block p-0 sm:space-x-0">
          {/* Speak Button */}
          <div className="flex justify-center py-3 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Speak
            </Button>
          </div>

          <div className="p-5 flex items-center gap-2 relative">
            <img
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              className="w-8 h-8 rounded-full absolute left-7 top-1/2 -translate-y-1/2"
              alt=""
            />
            <Input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Write a message..."
              className="w-full ps-12 pe-24 py-4 h-auto"
            />
            <div className="absolute end-7 top-1/2 -translate-y-1/2 flex gap-2">
              {/* <Button size="sm" variant="ghost" mode="icon">
                <Upload className="size-4!" />
              </Button> */}
              <Button size="sm" variant="mono">
                Send
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
