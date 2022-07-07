import React from "react";

export default function Input({ id, label, onChange, value, placeholder, ...rest }) {
  const handleChange = e => {
    const valid = e.currentTarget.checkValidity()
    onChange(valid ? e.currentTarget.value : "");
  }

  return <div className="input-group">
    <label htmlFor={id}>{label}</label>
    <input
        onChange={handleChange}
        value={value}
        id={id}
        placeholder={placeholder}
        {...rest}
    />
  </div>
};
