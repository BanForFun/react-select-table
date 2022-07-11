# Customizing the appearance

Each table can take a custom className as a prop, and in such custom class you can set the values
of predefined variables to customize the appearance, blissfully unaware of the element structure.

## With Css
Every property that has to do with the appearance, is set to the value of a css variable.
To find the name of the variable that controls the property that you want to customize, you can use inspect element.

For example, the variable that controls the color of selected rows, when the table is focused, is
`--rst-row_selected_focused_background-color`, and you can set it to light blue using:
```css
.selection-blue {
  --rst-row_selected_focused_background-color: lightblue;
}
```

### Fallback values

The naming convention for the css variables is `element_state1_..._stateN_property`,
and if the variable with that name is not defined or set to `unset`,
the properties that use that variable will fall back to the `element_state1_..._state(N-1)_property` variable,
recursively until the `element_property` variable.

For example, if you want to set the background color of the selected rows to light blue,
regardless if the table is focused or not, you can do it with:
```css
.selection-blue {
  --rst-row_selected_background-color: lightblue;
  --rst-row_selected_focused_background-color: unset;
}
```

### Default appearance

To customize the default appearance, make sure that your stylesheet is imported after the library's,
and set the variables just like in the example above, but inside the `rst-container` class.

## With Sass

There are 2 things than can only be customized using sass: Whether the even or the odd rows are striped,
and the prefix of the css variables (`rst-` by default).

Another advantage is that you can use the shorthand form to customize a border
(with css only you must set the width, style, and color, separately).

The simplest way to customize the appearance is with the `load-config` mixin.
It takes a configuration map as an argument, and you can see all the keys
it can have in [_variables.scss](../src/scss/_variables.scss).

For example, the key that controls the border between the columns is `column.border`,
and you can set it to 4px thick solid gray as such:
```scss
.thick-border {
  @include rst.load-config((
    "column.border": 4px solid gray
  ))
}
```

### Fallback values

The naming convention for the configuration keys is `element_state1_..._stateN.property`,
and if the key with that name is set to `unset`, the value of the `element_state1_..._state(N-1).property`
key will be used instead, recursively until the `element.property` key.
### Default appearance

To customize the default appearance, you can pass a map like the one `load-config` takes,
to the `$config` variable, when importing the stylesheet.

For example, to set the default appearance to a dark-mode style, and set the stripe order to odd:
```scss
@use '~react-select-table/src/scss/style' as rst with (
  $stripe-order: odd,
  $config: (
    "head.background-color": #2c3034,
    "head.border-color": white,
    "head.color": white,
    "root-container.background-color": #212529,
    "body.color": white,
    "pg-page.color": white,
    "pg-page.border": 1px solid transparent,
    "pg-page_current.background-color": transparent,
    "pg-page_current.border-color": white
  )
)
```


# Hiding columns on smaller screens

In a column object, you can set the `key` property to a string.
Then you can use media queries to control the visibility of said column.
For example, say that your table has a className of `table-responsive`,
then to hide the column with the key `id` on screens smaller than 600px you can use:
```css
@media screen and (max-width: 600px) {
  .table-responsive [data-col-key=id] {
    width: 0 !important;
  }
}
```
