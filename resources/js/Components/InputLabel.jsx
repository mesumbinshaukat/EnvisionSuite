import InfoIcon from '@/Components/InfoIcon';

export default function InputLabel({
    value,
    className = '',
    children,
    help,
    helpKey,
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
            {helpKey ? <InfoIcon helpKey={helpKey} /> : (help ? <InfoIcon help={help} /> : null)}
        </label>
    );
}
