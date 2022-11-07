window.UIController = class UIController {
  elementId;

  element;

  constructor(elementId) {
    this.elementId = elementId;

    if (!this.elementId) {
      throw new Error('StateController: elementId is required.')
    }

    this.element = document.getElementById(this.elementId);

    if (!this.element) {
      throw new Error('StateController: there is not element with this id.')
    }
  }

  renderList(value, cb) {
    this.element.innerHTML = '';

    Object.values(value).forEach(item => {
      const elementToAppend = cb(item);

      this.element.appendChild(elementToAppend);
    });
  }
}