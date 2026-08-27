
import { isValidElement } from 'react';
import { PackageIcon } from '../ui/Icons';
import { Button } from '../ui/Button';

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm',
  icon: Icon = PackageIcon,
  action,
  actionText,
  onAction,
}) {
  const btnText = action?.label || actionText;
  const btnClick = action?.onClick || onAction;

  const renderIcon = () => {
    if (isValidElement(Icon)) {
      return Icon;
    }
    if (typeof Icon === 'function' || typeof Icon === 'object') {
      const Comp = Icon;
      return <Comp size={36} />;
    }
    return <PackageIcon size={36} />;
  };

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {renderIcon()}
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {btnText && btnClick && (
        <Button variant="primary" size="sm" onClick={btnClick}>
          {btnText}
        </Button>
      )}
    </div>
  );
}
