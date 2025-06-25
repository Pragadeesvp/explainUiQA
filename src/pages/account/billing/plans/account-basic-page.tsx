import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/layouts/demo6/components/toolbar';
import { PageNavbar } from '@/pages/account';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountPlansContent } from '.';

export function AccountPlansPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Plans"
            description="Central Hub for Personal Customization"
          />
          <ToolbarActions>
            <Button variant="outline">View Billing</Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <AccountPlansContent />
      </Container>
    </Fragment>
  );
}
