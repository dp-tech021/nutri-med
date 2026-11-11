import type { ReactNode } from 'react';
import { classNames } from './utils';
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classNames('ui-container', className)}>{children}</div>;
}
