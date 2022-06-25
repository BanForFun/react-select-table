import React from "react";

export default function Input({ id, label, onChange, value, ...rest }) {
  const handleChange = e => onChange(e.currentTarget.value);
  return <React.Fragment>
    <label htmlFor={id}>{label}</label>
    <input
        placeholder={label}
        onChange={handleChange}
        value={value}
        id={id}
        {...rest}
    />
  </React.Fragment>
};
