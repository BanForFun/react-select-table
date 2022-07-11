# Importing the stylesheet
## With Css
In your `App.js`, at the top:
```javascript
import 'react-select-table/dist/index.css'
```

## With Sass
In your `App.js`, at the top:
```javascript
import './App.scss'
```

In `App.scss`:
```scss
@use "~react-select-table/src/scss/style" as rst
```


# Customizing the appearance
The default className for tables is `rst-default`, but you can pass a custom className as a prop to each table.

In these examples we will be customizing the default appearance.

## With Css
Every property that has to do with the appearance, is set to the value of a css variable.
To find the name of the variable that controls the property that you want to customize, you can use inspect element.

For example, the variable that controls the color of selected rows, when the table is focused, is
`--rst-row_selected_focused_background-color`, and you can set it to light blue using:
```css
.rst-default {
  --rst-row_selected_focused_background-color: lightblue;
}
```

### Fallback values

The naming convention for the css variables is `element_state1_..._stateN_property`,
and if the variable with that name is not defined or equal to `unset`,
the properties that use that variable will fall back to the `element_state1_..._state(N-1)_property` variable
recursively, until the `element_property` variable.

For example, if you want to set the background color of the selected rows to light blue,
no matter if the table is focused or not, you can do it with:
```css
.rst-default {
  --rst-row_selected_background-color: lightblue;
  --rst-row_selected_focused_background-color: unset;
}
```

## With Sass




# Hiding columns on smaller screens
