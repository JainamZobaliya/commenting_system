function createComment(tagName, textContent, backgroundColor) {
    const element = document.createElement("div");
    element.textContent = textContent;
    element.style.backgroundColor = backgroundColor;
    return element;
}