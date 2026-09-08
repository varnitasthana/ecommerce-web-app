import './Input.css';

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        {...props}
      />
    </div>
  );
}

export default Input;
