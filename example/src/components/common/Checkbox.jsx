import React from "react"

export default function Checkbox({ id, label, onChange, checked, ...rest }) {
  const handleChange = e => onChange(e.currentTarget.checked);
  return <React.Fragment>
    <input type="checkbox"
           id={id}
           checked={checked}
           onChange={handleChange}
           {...rest}
    />
    <label htmlFor={id}>{label}</label>
  </React.Fragment>
}
