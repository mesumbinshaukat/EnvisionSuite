import Tooltip from '@/Components/Tooltip';

export default function InputLabel({
    value,
    className = '',
    children,
    help,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `flex items-center gap-1 text-sm font-medium text-gray-700 ` +
                className
            }
        >
            <span>{value ? value : children}</span>
            {help ? <Tooltip text={help} /> : null}
        </label>
    );
}
