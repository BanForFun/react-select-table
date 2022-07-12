import _ from 'lodash'
import React, { Fragment } from 'react'
import { toast } from 'react-toastify'

function eventArgToString(arg) {
  if (arg == null)
    return "<null>"

  if (arg instanceof Set)
    return [...arg].toString()

  return arg.toString()
}

export function eventToast(title, args = {}) {
  const content = <>
    <b>{title}</b>
    <div style={{ whiteSpace: "nowrap" }}>
      {_.map(args, (arg, name) => <Fragment key={name}>
        {name}: {eventArgToString(arg)}<br/>
      </Fragment>)}
    </div>
  </>

  if (toast.isActive(title))
    return toast.update(title, { render: content })

  toast.info(content, { toastId: title })
}
