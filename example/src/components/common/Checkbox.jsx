import React from "react"

export default function Checkbox({ id, label, onChange, checked, ...rest }) {
  const handleChange = e => onChange(e.currentTarget.checked);
  return <div className="input-group">
    <input type="checkbox"
           id={id}
           checked={checked}
           onChange={handleChange}
           {...rest}
    />
    <label htmlFor={id}>{label}</label>
  </div>
}
