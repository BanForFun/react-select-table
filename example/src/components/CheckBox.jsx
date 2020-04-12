import React from 'react';

const CheckBox = ({ label, onChange, id, value }) => {
    const handleChange = ({ target }) =>
        onChange(target.checked);

    return (
        <div className="form-check">
            <input className="form-check-input"
                type="checkbox"
                id={id} checked={value}
                onChange={handleChange}
            />
            <label className="form-check-label"
                htmlFor={id}>{label}</label>
        </div>
    );
}

export default CheckBox;