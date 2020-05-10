export function touchToMouseEvent(e) {
    const [touch] = e.touches;
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
}