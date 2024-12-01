import cn from 'classnames';
import { history } from '@umijs/max';

export const TableLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}> = ({ href, children, className, external = true }) => {
  return (
    <a
      className={cn(
        "cursor-pointer hover:text-blue-500 transition-colors",
        "inline-flex items-center gap-1",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        if (external) {
          window.open(href, '_blank');
        } else {
          history.push(href);
        }
      }}
    >
      {children}
    </a>
  );
};
