import React from "react";

const Input = ({ id, label, onChange, value, ...rest }) => {
    const handleChange = e => onChange(e.target.value);

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <input
                placeholder={label}
                className="form-control"
                onChange={handleChange}
                value={value}
                id={id}
                {...rest}
            />
        </div>
    );
};

export default Input;
