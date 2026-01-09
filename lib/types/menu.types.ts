export interface MenuItemTypes {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
  children?: MenuItemTypes[];
}

export interface MenuSection {
  title?: string;
  items: MenuItemTypes[];
}