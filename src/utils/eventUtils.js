export function touchToMouseEvent(e, prevent = false) {
    const [touch] = e.touches;
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
    e.stopPropagation();

    if (prevent) e.preventDefault();
}