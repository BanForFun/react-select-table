import React from "react";

export default function Input({ id, label, onChange, value, ...rest }) {
  const handleChange = e => onChange(e.currentTarget.value);
  return <div className="input-group break">
    <label htmlFor={id}>{label}</label>
    <input
        placeholder={label}
        onChange={handleChange}
        value={value}
        id={id}
        {...rest}
    />
  </div>
};
