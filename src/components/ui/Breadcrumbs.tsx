import { Link } from 'react-router-dom';
export type BreadcrumbItem = { label: string; to?: string };
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <nav className="ui-breadcrumbs" aria-label="Navegação estrutural"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{index > 0 && <span aria-hidden="true">/</span>}{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>;
}
