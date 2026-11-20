import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/* variant: primary | outline | danger | danger-outline | green-outline | ghost | ghost-border | dark | gold | gold-outline
   size: sm | md | lg. Pass `to` to make it a link. */
export function Button({ variant = 'primary', size = 'md', icon, iconAfter, to, children, className = '', ...rest }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`;
  const px = size === 'sm' ? 14 : 17;
  const content = (
    <>
      {icon && <Icon name={icon} size={px} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={px} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  return <button type="button" className={cls} {...rest}>{content}</button>;
}
