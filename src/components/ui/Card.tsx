import type { ReactNode } from 'react';
import { classNames } from './utils';

export function Card({ children, className, as = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'article' | 'div' }) {
  const Component = as;
  return <Component className={classNames('ui-card', className)}>{children}</Component>;
}
