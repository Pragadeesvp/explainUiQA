import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { customNavbar } from '@/config/menu.config';

const PageMenu = () => {
  const accountMenuConfig = customNavbar;

  if (accountMenuConfig) {
    return <NavbarMenu items={accountMenuConfig} />;
  } else {
    return <></>;
  }
};

export { PageMenu };
